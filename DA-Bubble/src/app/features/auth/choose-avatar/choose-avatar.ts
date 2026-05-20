import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-choose-avatar',
  imports: [RouterLink],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar {
  goBack(){
    window.history.back();
  }
}
