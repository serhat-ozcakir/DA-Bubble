import { Component } from '@angular/core';

@Component({
  selector: 'app-reset-password',
  imports: [],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  goBack() {
    window.history.back();
  }
}
