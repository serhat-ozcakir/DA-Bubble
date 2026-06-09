import { Component, inject, input, Input } from '@angular/core';
import { MessageView } from '../../../../core/models/message-view.model';
import {MessageService} from '../../../../core/services/message.service'

@Component({
  selector: 'app-message-item',
  imports: [],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItemComponent {

  message= input.required<MessageView>();
  private messageService = inject(MessageService)

  openThread():void{
    this.messageService.openThread(this.message())
  }

}
