import { Component } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
 // [x: string]: any;
  signUpForm: FormGroup;

  constructor(
    private router: Router,
    private authService: Auth
  ) {
    this.signUpForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      terms: new FormControl(false, [Validators.requiredTrue])
    });
  }

  goBack() {
    window.history.back();
  }
  onSignUp(){
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }
   // const name = this.signUpForm.get('name')?.value;
   // const email = this.signUpForm.get('email')?.value;
   // const password = this.signUpForm.get('password')?.value;
    //const terms = this.signUpForm.get('terms')?.value;
   // this.signUpForm.reset();
    this.authService.setRegisterData({
      name: this.signUpForm.get('name')?.value,
      email: this.signUpForm.get('email')?.value,
      password: this.signUpForm.get('password')?.value,
    });
    this.router.navigate(['/choose-avatar']);
  }

}



