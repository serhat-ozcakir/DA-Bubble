import { Component } from '@angular/core';
import { Auth } from '../../../core/services/auth.service';
import { Router , RouterLink} from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators} from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  resetForm: FormGroup;
  constructor(private authService: Auth, private router: Router, private toastService: ToastService) {
    this.resetForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  async onResetPassword(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const password = this.resetForm.get('password')?.value;
    const confirmPassword = this.resetForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    try{
      await this.authService.updatePassword(password);
      console.log('Password reset successful');
      this.toastService.show('Passwort erfolgreich zurückgesetzt!');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error resetting password:', error);
      this.toastService.show('Fehler beim Zurücksetzen des Passworts.');
    }

  }

  goBack() {
    window.history.back();
  }
}
