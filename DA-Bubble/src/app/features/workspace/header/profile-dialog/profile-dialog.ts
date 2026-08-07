import { Component, EventEmitter, inject, Output } from '@angular/core';
import { Auth } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-dialog',
  imports: [],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss',
})
export class ProfileDialog {
  constructor(public auth: Auth) { }
  authService = inject(Auth);
  @Output() closeDialog = new EventEmitter<void>();
  @Output() openEditProfileDialogEvent = new EventEmitter<void>();

  close(): void {
    this.closeDialog.emit();
  }

  openEditProfileDialog(): void {
    this.openEditProfileDialogEvent.emit();
  }
}