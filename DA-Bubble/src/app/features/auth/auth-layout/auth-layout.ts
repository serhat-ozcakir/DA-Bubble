import { Component } from '@angular/core';
import { AuthHeader } from '../auth-header/auth-header';
import { AuthFooter } from '../auth-footer/auth-footer'
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [AuthHeader, AuthFooter, RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {

}
