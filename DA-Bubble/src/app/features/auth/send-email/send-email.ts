import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-send-email',
  imports: [RouterLink],
  templateUrl: './send-email.html',
  styleUrl: './send-email.scss',
})

export class SendEmail {
  goBack(){
    window.history.back();
  }
}
