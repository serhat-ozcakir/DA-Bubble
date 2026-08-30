import { Component } from '@angular/core';
import {FormControl,FormGroup, ReactiveFormsModule,Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  resetForm = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  constructor(
    private authService: Auth,
    private router: Router,
    private toastService: ToastService
  ) {}

  async onResetPassword(): Promise<void> {
    if (!this.isFormValid()) return;

    const password = this.resetForm.get('password')?.value ?? '';
    const confirmPassword = this.resetForm.get('confirmPassword')?.value ?? '';

    if (!this.passwordsMatch(password, confirmPassword)) return;
    await this.updatePassword(password);
  }

  // Reveals validation errors before attempting
  // to update the password.
  private isFormValid(): boolean {
    if (this.resetForm.valid) return true;
    this.resetForm.markAllAsTouched();
    return false;
  }
    
  // Adds a custom mismatch error to the confirmation field
  // so the template can show a password-specific validation message.
  private passwordsMatch(password: string, confirmPassword: string): boolean {
    if (password === confirmPassword) return true;
    this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
    return false;
  }

  private async updatePassword(password: string): Promise<void> {
    try {
      await this.authService.updatePassword(password);
      this.handleResetSuccess();
    } catch (error) {
      this.handleResetError(error);
    }
  }

  private handleResetSuccess(): void {
    this.toastService.show('Passwort erfolgreich zurückgesetzt!');
    this.router.navigate(['/login']);
  }

  private handleResetError(error: unknown): void {
    console.error('Error resetting password:', error);
    this.toastService.show('Fehler beim Zurücksetzen des Passworts.');
  }

  goBack(): void {
    window.history.back();
  }
}