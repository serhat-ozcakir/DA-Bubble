import { Component, HostListener, ElementRef, inject, computed, signal, } from '@angular/core';
import { Auth } from '../../../core/services/auth.service';
import { UserMenu } from './user-menu/user-menu';
import { ProfileDialog } from './profile-dialog/profile-dialog';
import { EditProfileDialog } from './edit-profile-dialog/edit-profile-dialog';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { Profile } from '../../../core/models/profile.model';
import { DirectMessageService } from '../../../core/services/direct-message.service';

@Component({
  selector: 'app-header',
  imports: [UserMenu, ProfileDialog, EditProfileDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private elementRef = inject(ElementRef);
  userService = inject(UserService);
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

    if (!search) {
      return users;
    }

    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
    );
  });

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


  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText.set(input.value)
  }

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchText.set('');
  }

  selectUser(user: Profile): void {
    this.directMessageService.selectDmUSer(user);
    this.closeSearch();
  }
}

