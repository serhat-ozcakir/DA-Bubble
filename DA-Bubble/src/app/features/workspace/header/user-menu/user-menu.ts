import { Component, EventEmitter, Output } from '@angular/core';
import { Auth } from '../../../../core/services/auth.service';


@Component({
  selector: 'app-user-menu',
  imports: [],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {

  constructor(public auth: Auth) { }

  @Output() onProfileClick = new EventEmitter<void>();

  onProfileButtonClick(): void {
    this.onProfileClick.emit();
  }

}
