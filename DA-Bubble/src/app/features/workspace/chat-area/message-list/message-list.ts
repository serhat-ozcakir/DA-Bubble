import { Component, inject } from '@angular/core';
import {  MessageItemComponent } from '../message-item/message-item';
import { MessageView } from '../../../../core/models/message-view.model';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-message-list',
  imports: [MessageItemComponent],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
})
export class MessageList {
  messageService = inject(MessageService);

}