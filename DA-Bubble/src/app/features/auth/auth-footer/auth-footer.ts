import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-auth-footer',
  imports: [NgStyle, CommonModule],
  templateUrl: './auth-footer.html',
  styleUrl: './auth-footer.scss',
})
export class AuthFooter {
@Input() showLogo: boolean = false;
}
