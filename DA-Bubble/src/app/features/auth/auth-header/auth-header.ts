import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './auth-header.html',
  styleUrl: './auth-header.scss',
})
export class AuthHeader {
  @Input() showRegisterLinks: boolean = false;
  @Input() showLogo: boolean = false;
}
