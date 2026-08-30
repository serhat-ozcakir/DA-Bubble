import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  isGuestLoading = signal(false);

  constructor(
    private authService: Auth,
    private router: Router,
    private toastService: ToastService
  ) {}

  async onLogin(): Promise<void> {
    // Reveals validation errors before attempting authentication.
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    await this.performLogin();
    this.loginForm.reset();
  }

  private async performLogin(): Promise<void> {
    const email = this.loginForm.get('email')?.value ?? '';
    const password = this.loginForm.get('password')?.value ?? '';

    try {
      const data = await this.authService.login(email, password);
      this.handleLoginSuccess(data);
    } catch (error) {
      this.handleLoginError(error);
    }
  }

  // Keeps the success toast visible briefly before
  // navigating to the workspace.
  private handleLoginSuccess(data: unknown): void {
    this.toastService.show('Erfolgreich eingeloggt!');
    setTimeout(() => {
      this.router.navigate(['/workspace']);
    }, 1000);
  }

  private handleLoginError(error: unknown): void {
    console.error('Login error:', error);
    this.toastService.show('Fehler beim Einloggen.');
  }

  async onGoogleLogin(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      this.handleGoogleLoginError(error);
    }
  }

  private handleGoogleLoginError(error: unknown): void {
    console.error('Google login error:', error);
    this.toastService.show(
      'Google-Anmeldung konnte nicht gestartet werden.'
    );
  }

  async onGuestLogin(): Promise<void> {
    // Prevents duplicate anonymous sessions from being created
    // while a guest login request is already in progress.
    if (this.isGuestLoading()) return;
    this.isGuestLoading.set(true);

    try {
      await this.performGuestLogin();
    } catch (error) {
      this.handleGuestLoginError(error);
    } finally {
      this.isGuestLoading.set(false);
    }
  }

  // Guest authentication prepares the temporary account
  // before opening the workspace.
  private async performGuestLogin(): Promise<void> {
    await this.authService.guestLogin();
    this.toastService.show('Erfolgreich als Gast angemeldet!');
    await this.router.navigateByUrl('/workspace');
  }

  private handleGuestLoginError(error: unknown): void {
    console.error('Guest login error:', error);
    this.toastService.show('Gast-Anmeldung fehlgeschlagen.');
  }
}