import { Component, HostListener, ElementRef, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth.service';
import { UserMenu } from './user-menu/user-menu';
import { ProfileDialog } from './profile-dialog/profile-dialog';
import { EditProfileDialog } from './edit-profile-dialog/edit-profile-dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [UserMenu, ProfileDialog, EditProfileDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private elementRef = inject(ElementRef)
  isUserMenuOpen = false;
  isProfileMenuOpen = false;
  isEditProfileDialogOpen = false;

  constructor(public auth: Auth,
    private router: Router
  ) { }

  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.isUserMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeUserMenuOnEscape(): void {
    this.isUserMenuOpen = false;
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
}

