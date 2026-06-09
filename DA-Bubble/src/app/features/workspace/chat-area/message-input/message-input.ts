import { Component, inject } from '@angular/core';
import { MessageService } from '../../../../core/services/message.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-message-input',
  imports: [FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput {
 messageService = inject(MessageService);
  messageText: string = '';



 async sendMessage() {
    if (this.messageText.trim() !== '') {
      console.log('Nachricht gesendet:', this.messageText);
      await this.messageService.sendMessage(this.messageText);
      this.messageText = '';
    }
  }

}
