import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallback implements OnInit {
  constructor(
    private authService: Auth,
    private router: Router,
    private toastService: ToastService
  ) {}

  // Processes the OAuth callback as soon as the redirect
  // returns to the application.
  async ngOnInit(): Promise<void> {
    try {
      await this.handleGoogleCallback();
    } catch (error) {
      await this.handleCallbackError(error);
    }
  }

  // New Google users complete their profile first,
  // while existing users continue directly to the workspace.
  private async handleGoogleCallback(): Promise<void> {
    const isNewUser = await this.authService.ensureGoogleProfile();

    if (isNewUser) {
      await this.router.navigate(['/choose-avatar']);
      return;
    }
    await this.completeGoogleLogin();
  }

  private async completeGoogleLogin(): Promise<void> {
    await this.authService.updateStatus('online');
    this.toastService.show('Google Anmeldung erfolgreich!');
    await this.router.navigate(['/workspace']);
  }

  private async handleCallbackError(error: unknown): Promise<void> {
    console.error('Google callback error:', error);
    this.toastService.show('Google-Anmeldung fehlgeschlagen.');
    await this.router.navigate(['/login']);
  }
}