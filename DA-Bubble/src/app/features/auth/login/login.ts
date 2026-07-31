import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, RouterEvent, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  isGuestLoading = signal(false);

  constructor(
    private authService: Auth,
    private router: Router,
    private toastService: ToastService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }
  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    try {
      const data = await this.authService.login(email, password);
      console.log('Login successful:', data);
      this.toastService.show('Erfolgreich eingeloggt!');
      setTimeout(() => {

        this.router.navigate(['/workspace']);
      }, 1000)

    } catch (error) {
      console.error('Login error:', error);
      this.toastService.show('Fehler beim Einloggen.');
    }
    this.loginForm.reset();

  }

  async onGoogleLogin(): Promise<void> {
  try {
    await this.authService.signInWithGoogle();
  } catch (error) {
    console.error('Google login error:', error);

    this.toastService.show(
      'Google-Anmeldung konnte nicht gestartet werden.'
    );
  }
}

async onGuestLogin(): Promise<void> {
  if (this.isGuestLoading()) {
    return;
  }

  this.isGuestLoading.set(true);

  try {
    await this.authService.guestLogin();

    this.toastService.show('Erfolgreich als Gast angemeldet!');

    await this.router.navigateByUrl('/workspace');
  } catch (error) {
    console.error('Guest login error:', error);

    this.toastService.show('Gast-Anmeldung fehlgeschlagen.');
  } finally {
    this.isGuestLoading.set(false);
  }
}
}