import { Component } from '@angular/core';
import { Auth } from '../../../core/services/auth.service';
import {UserMenu} from './user-menu/user-menu';
import {ProfileDialog} from './profile-dialog/profile-dialog';
import {EditProfileDialog} from './edit-profile-dialog/edit-profile-dialog';  

@Component({
  selector: 'app-header',
  imports: [UserMenu, ProfileDialog, EditProfileDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  isUserMenuOpen = false;
  isProfileMenuOpen = false;
  isEditProfileDialogOpen = false;

  constructor(public auth: Auth) {

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
}

