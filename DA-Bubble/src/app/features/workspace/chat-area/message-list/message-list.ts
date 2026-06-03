import { Component } from '@angular/core';
import {  MessageItem, MessageItemComponent } from '../message-item/message-item';

@Component({
  selector: 'app-message-list',
  imports: [MessageItemComponent],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
})
export class MessageList {
  messages: MessageItem[] = [
    {
    author: 'Noah Braun',
    time: '14:25 Uhr',
    text: 'Welche Version ist aktuell von Angular?',
    avatar: 'assets/img/avatar/avatar-3.png',
    isOwnMessage: false,
    threadCount: 2
    },
      {
      author: 'Frederik Beck',
      time: '15:06 Uhr',
      text: 'Ja das ist es.',
      avatar: 'assets/img/avatar/avatar-1.png',
      isOwnMessage: true,
    },
  ];
}