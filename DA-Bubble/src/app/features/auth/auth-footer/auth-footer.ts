import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-footer',
  imports: [NgStyle, CommonModule, RouterLink],
  templateUrl: './auth-footer.html',
  styleUrl: './auth-footer.scss',
})

export class AuthFooter {
@Input() showLogo: boolean = false;
}
