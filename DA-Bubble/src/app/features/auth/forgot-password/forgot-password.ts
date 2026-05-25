import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators} from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  forgotPasswordForm: FormGroup;

  constructor(private router: Router, 
    private authService: Auth, 
  private toastService: ToastService) {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  async onForgotPassword(): Promise<void> {
    if(this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    const email = this.forgotPasswordForm.get('email')?.value;
    try {
      await this.authService.resetPassword(email);
      this.toastService.show('E-Mail gesendet!');
      this.router.navigate(['/send-email']);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }

  goBack(){
    window.history.back();
  }
}

