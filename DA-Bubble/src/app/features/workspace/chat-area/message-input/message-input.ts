import { Component, inject } from '@angular/core';
import { MessageService } from '../../../../core/services/message.service';
import { FormsModule } from '@angular/forms';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { ChannelService } from '../../../../core/services/channel.service';




@Component({
  selector: 'app-message-input',
  imports: [FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput {
messageService = inject(MessageService);
directMessageService = inject(DirectMessageService);
channelService = inject(ChannelService)
messageText: string = '';



async sendMessage(): Promise<void> {
  const text = this.messageText.trim();

  if (!text) return;

  console.log('DM USER:', this.directMessageService.currentDmUser());

  if (this.directMessageService.currentDmUser()) {
    console.log('DM gönderiliyor');
    await this.directMessageService.sendDirectMessage(text);
  } else {
    console.log('Channel mesajı gönderiliyor');
    await this.messageService.sendMessage(text);
  }

  this.messageText = '';
}

}
