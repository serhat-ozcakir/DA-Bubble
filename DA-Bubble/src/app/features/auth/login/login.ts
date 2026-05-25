import { Component } from '@angular/core';
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
}