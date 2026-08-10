import { Component, HostListener, ElementRef, inject, computed, signal, input, } from '@angular/core';
import { Auth } from '../../../core/services/auth.service';
import { UserMenu } from './user-menu/user-menu';
import { ProfileDialog } from './profile-dialog/profile-dialog';
import { EditProfileDialog } from './edit-profile-dialog/edit-profile-dialog';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { Profile } from '../../../core/models/profile.model';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { ChannelService } from '../../../core/services/channel.service';
import { Channel } from '../../../core/models/channel.model';
import { Search } from '../../../core/services/search.service';
import { SearchResult } from '../../../core/models/search-result.model';

@Component({
  selector: 'app-header',
  imports: [UserMenu, ProfileDialog, EditProfileDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  threadOpen = input(false);
  private elementRef = inject(ElementRef);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  searchService = inject(Search);
  directMessageService = inject(DirectMessageService);
  isUserMenuOpen = false;
  isProfileMenuOpen = false;
  isEditProfileDialogOpen = false;
  searchText = signal('');
  isSearchOpen = signal(false);

  constructor(public auth: Auth,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.userService.loadUsers();
  }

  filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const users = this.userService.user();

    if (search.startsWith('#')) {
      return [];
    }

    if (search.startsWith('@')) {
      const userSearch = search.slice(1).trim();

      if (!userSearch) {
        return users;
      }

      return users.filter((user) =>
        user.name.toLowerCase().includes(userSearch)
      );
    }

    if (!search) {
      return users;
    }

    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
    );
  });

  filteredChannels = computed(() => {
    const search = this.searchText().toLowerCase().trim();

    if (!search.startsWith('#')) {
      return [];
    }

    const channelSearch = search.slice(1).trim();
    if (!channelSearch) {
      return this.channelService.channels();
    }
    return this.channelService.channels().filter((channel) =>
      channel.name.toLowerCase().includes(channelSearch)
    )
  })

  searchMode = computed<'users' | 'channels' | 'messages'>(() => {
    const search = this.searchText().trim();
    if (!search || search.startsWith('@')) {
      return 'users'
    }

    if (!search || search.startsWith('#')) {
      return 'channels'
    }

    return 'messages'
  })

  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.isUserMenuOpen = false;
      this.isSearchOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeUserMenuOnEscape(): void {
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

  openEditProfileDialog(): void {
    this.isEditProfileDialogOpen = true;
    this.isProfileMenuOpen = false;
  }

  closeEditProfileDialog(): void {
    this.isEditProfileDialogOpen = false;
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.isUserMenuOpen = false;
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }


  async onSearchInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const value = input.value
    this.searchText.set(value);
    this.isSearchOpen.set(true);

    if (this.searchMode() === 'messages') {
      await this.searchService.searchChannelMessages(value)
    } else {
      this.searchService.clearSearch();
    }
  }

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchText.set('');
  }

  selectUser(user: Profile): void {
    this.directMessageService.selectDmUser(user);
    this.closeSearch();
  }

  selectChannel(channel: Channel): void {
    this.directMessageService.currentDmUser.set(null);
    this.channelService.setCurrentChannel(channel);
    this.closeSearch();
  }

  async selectMessageResult(result: SearchResult): Promise<void> {

    if (result.type === 'channel-message') {
      this.openChannelResult(result);
    }

    if (result.type === 'direct-message') {
      this.openDirectMessageResult(result);
    }
  }

  private openChannelResult(result: SearchResult): void {
    if (!result.channelId) {
      return;
    }

    const channel = this.channelService
      .channels()
      .find((channel) => channel.id === result.channelId);

    if (!channel) {
      return;
    }

    this.directMessageService.currentDmUser.set(null);
    this.channelService.setCurrentChannel(channel);
    this.closeSearch();
  }

  private async openDirectMessageResult(result: SearchResult): Promise<void> {
    if (!result.profileId) {
      return;
    }

    const user = this.userService.user()
    .find((user)=> user.id === result.profileId)

    if(!user){
      return;
    }
    await this.directMessageService.selectDmUser(user);
    this.closeSearch();
  }


}

