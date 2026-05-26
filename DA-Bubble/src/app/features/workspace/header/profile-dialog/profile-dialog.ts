import { Component, EventEmitter, Output } from '@angular/core';
import { Auth } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-dialog',
  imports: [],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss',
})
export class ProfileDialog {
 constructor(public auth: Auth) { }

@Output() closeDialog = new EventEmitter<void>();

close(): void {
  this.closeDialog.emit();
}

}