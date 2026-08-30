import {Component, computed, ElementRef, HostListener, 
  inject, input, OnInit, output, signal} from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { Search } from '../../../core/services/search.service';
import { Profile } from '../../../core/models/profile.model';
import { Channel } from '../../../core/models/channel.model';
import { SearchResult } from '../../../core/models/search-result.model';
import { UserMenu } from './user-menu/user-menu';
import { ProfileDialog } from './profile-dialog/profile-dialog';
import { EditProfileDialog } from './edit-profile-dialog/edit-profile-dialog';

@Component({
  selector: 'app-header',
  imports: [UserMenu, ProfileDialog, EditProfileDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header implements OnInit {
  auth = inject(Auth);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  searchService = inject(Search);
  directMessageService = inject(DirectMessageService);

  private elementRef = inject(ElementRef);
  private router = inject(Router);

  threadOpen = input(false);
  mobileChatOpen = input(false);
  mobilSearchView = input(false);

  mobileBack = output<void>();
  mobileSearchOpen = output<void>();

  isUserMenuOpen = false;
  isProfileMenuOpen = false;
  isEditProfileDialogOpen = false;

  searchText = signal('');
  isSearchOpen = signal(false);

  // Treats # searches as channel-only queries
  // and keeps @ optional for user filtering.
  filteredUsers = computed(() => {
    const search = this.getNormalizedSearch();

    if (search.startsWith('#')) return [];

    const userSearch = this.getUserSearch(search);
    return this.filterUsers(userSearch);
  });

  filteredChannels = computed(() => {
    const search = this.getNormalizedSearch();
    if (!search.startsWith('#')) return [];

    const channelSearch = search.slice(1).trim();
    const channels = this.channelService.channels();

    if (!channelSearch) return channels;

    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(channelSearch)
    );
  });

  // Chooses the search strategy from the query prefix:
  // @ for users, # for channels, plain text for messages.
  searchMode = computed<'users' | 'channels' | 'messages'>(() => {
    const search = this.searchText().trim();

    if (!search || search.startsWith('@')) return 'users';
    if (search.startsWith('#')) return 'channels';

    return 'messages';
  });

  async ngOnInit(): Promise<void> {
    await this.userService.loadUsers();
  }

  onMobileBack(): void {
    this.closeSearch();
    this.mobileBack.emit();
  }

  // Closes transient header overlays when focus moves
  // outside the header or Escape is pressed.
  @HostListener('document:click', ['$event'])
  closeMenusOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) this.closeHeaderOverlays();
  }

  @HostListener('document:keydown.escape')
  closeMenusOnEscape(): void {
    this.closeHeaderOverlays();
  }

  private closeHeaderOverlays(): void {
    this.isUserMenuOpen = false;
    this.isSearchOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  openProfileMenu(): void {
    this.isProfileMenuOpen = true;
    this.isUserMenuOpen = false;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  openEditProfileDialog(): void {
    this.isEditProfileDialogOpen = true;
    this.isProfileMenuOpen = false;
  }

  closeEditProfileDialog(): void {
    this.isEditProfileDialogOpen = false;
  }
  // Completes logout before clearing account UI
  // and returning the user to the login screen.
  async logout(): Promise<void> {
    await this.auth.logout();
    this.closeAccountMenus();
    this.router.navigate(['/login']);
  }

  private closeAccountMenus(): void {
    this.isUserMenuOpen = false;
    this.isProfileMenuOpen = false;
  }

  // Keeps lightweight user/channel filtering local
  // and triggers async search only for message queries.
  async onSearchInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.searchText.set(input.value);
    this.isSearchOpen.set(true);
    await this.updateMessageSearch(input.value);
  }

  private async updateMessageSearch(value: string): Promise<void> {
    if (this.searchMode() === 'messages') {
      await this.searchService.searchChannelMessages(value);
      return;
    }
    this.searchService.clearSearch();
  }

  // Delegates mobile search to the workspace layout,
  // while desktop search opens directly in the header
  openSearch(): void {
    if (this.isMobileSearch()) {
      this.mobileSearchOpen.emit();
      return;
    }
    this.isSearchOpen.set(true);
  }

  private isMobileSearch(): boolean {
    return window.matchMedia('(max-width: 1024px)').matches;
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchText.set('');
  }

  selectUser(user: Profile): void {
    this.directMessageService.selectDmUser(user);
    this.closeSearch();
  }
  // Leaves DM mode before activating the selected channel.
  selectChannel(channel: Channel): void {
    this.directMessageService.currentDmUser.set(null);
    this.channelService.setCurrentChannel(channel);
    this.closeSearch();
  }
  
  // Routes a search result to the correct conversation
  // based on whether it came from a channel or a DM.
  async selectMessageResult(result: SearchResult): Promise<void> {
    if (result.type === 'channel-message') {
      this.openChannelResult(result);
      return;
    }

    if (result.type === 'direct-message') {
      await this.openDirectMessageResult(result);
    }
  }

  private openChannelResult(result: SearchResult): void {
    if (!result.channelId) return;

    const channel = this.findChannel(result.channelId);
    if (!channel) return;

    this.directMessageService.currentDmUser.set(null);
    this.channelService.setCurrentChannel(channel);
    this.closeSearch();
  }

  private findChannel(channelId: string): Channel | undefined {
    return this.channelService
      .channels()
      .find((channel) => channel.id === channelId);
  }

  private async openDirectMessageResult(result: SearchResult): Promise<void> {
    if (!result.profileId) return;

    const user = this.findUser(result.profileId);
    if (!user) return;

    await this.directMessageService.selectDmUser(user);
    this.closeSearch();
  }

  private findUser(profileId: string): Profile | undefined {
    return this.userService
      .user()
      .find((user) => user.id === profileId);
  }

  private getNormalizedSearch(): string {
    return this.searchText().toLowerCase().trim();
  }

  private getUserSearch(search: string): string {
    return search.startsWith('@')
      ? search.slice(1).trim()
      : search;
  }

  private filterUsers(search: string): Profile[] {
    const users = this.userService.user();
    if (!search) return users;

    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
    );
  }
}