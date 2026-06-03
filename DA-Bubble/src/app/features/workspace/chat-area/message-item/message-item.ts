import { Component, Input } from '@angular/core';

export type MessageItem = {
  author: string;
  time: string;
  text: string;
  avatar: string;
  isOwnMessage: boolean;
  threadCount?: number;
};

@Component({
  selector: 'app-message-item',
  imports: [],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItemComponent {

  @Input() message!: MessageItem;

}
