import { Component, input, Input } from '@angular/core';
import { MessageView } from '../../../../core/models/message-view.model';

@Component({
  selector: 'app-message-item',
  imports: [],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItemComponent {

  message= input.required<MessageView>();

}
