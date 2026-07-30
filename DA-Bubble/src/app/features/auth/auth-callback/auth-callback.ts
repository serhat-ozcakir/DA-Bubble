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
  ) {

  }

async ngOnInit(): Promise<void> {
  try {
    const isNewGoogleUser = await this.authService.ensureGoogleProfile();

    if (isNewGoogleUser) {
      await this.router.navigate(['/choose-avatar']);
      return;
    }

    await this.authService.updateStatus('online');

    this.toastService.show('Google Anmeldung erfolgreich!');

    await this.router.navigate(['/workspace']);
  } catch (error) {
    console.error('Google callback error:', error);

    this.toastService.show('Google-Anmeldung fehlgeschlagen.');

    await this.router.navigate(['/login']);
  }
}
}
