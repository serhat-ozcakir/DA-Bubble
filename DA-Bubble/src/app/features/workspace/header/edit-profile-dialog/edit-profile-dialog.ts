import { HostListener, Component, EventEmitter, Output } from '@angular/core';
import { Auth } from '../../../../core/services/auth.service';
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-edit-profile-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-profile-dialog.html',
  styleUrl: './edit-profile-dialog.scss',
})
export class EditProfileDialog {
  @Output() closeDialogEvent = new EventEmitter<void>();

  nameControl: FormControl<string>;

  constructor(public auth: Auth, private toastService: ToastService) {
    this.nameControl = new FormControl(this.auth.currentUserProfile()?.name ?? '',
      {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,

      });

  }
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.closeDialogEvent.emit();
  }

  async onProfileName() {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    await this.auth.updateProfileName(this.nameControl.value);
    this.toastService.show('Profilname aktualisiert!');
    this.close();
  }
}
