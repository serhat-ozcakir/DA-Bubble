import { Injectable, signal } from '@angular/core';
import {MessageView} from "../models/message-view.model";

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messages = signal<MessageView[]>([
  {
      id: '1',
      authorName: 'Noah Braun',
      avatar: 'assets/img/avatar/avatar-3.png',
      text: 'Welche Version ist aktuell von Angular?',
      time: '14:25 Uhr',
      isOwnMessage: false,
      threadCount: 2,
    },
    {
      id: '2',
      authorName: 'Frederik Beck',
      avatar: 'assets/img/avatar/avatar-1.png',
      text: 'Angular 20',
      time: '15:00 Uhr',
      isOwnMessage: true,
    }]);

    sendMessage(text: string) {
      const newMessage: MessageView = {
        id: crypto.randomUUID(),
        authorName: 'Serhat',
        avatar: 'assets/img/avatar/avatar-1.png',
        text: text,
        time: 'Jetzt',
        isOwnMessage: true,
      };
      this.messages.update(messages => [...messages, newMessage]);
    }
  }