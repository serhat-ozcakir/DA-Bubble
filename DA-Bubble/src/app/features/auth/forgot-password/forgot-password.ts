import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
  });

  constructor(
    private router: Router,
    private authService: Auth,
    private toastService: ToastService
  ) {}

  async onForgotPassword(): Promise<void> {
    // Marks all fields as touched so validation errors
    // become visible before the reset request is sent.
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    await this.sendResetEmail();
  }

  private async sendResetEmail(): Promise<void> {
    const email = this.forgotPasswordForm.get('email')?.value;

    try {
      await this.authService.resetPassword(email ?? '');
      this.handleResetSuccess();
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }

  private handleResetSuccess(): void {
    this.toastService.show('E-Mail gesendet!');
    this.router.navigate(['/send-email']);
  }

  goBack(): void {
    window.history.back();
  }
}