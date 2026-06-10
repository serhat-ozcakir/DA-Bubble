import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-thread-input',
  imports: [FormsModule],
  templateUrl: './thread-input.html',
  styleUrl: './thread-input.scss',
})
export class ThreadInput {
  private messsageServis = inject(MessageService)

  replyText = '';

  async sendReply():Promise<void>{
    const text = this.replyText.trim();
    if(!text) return;
    await this.messsageServis.sendThreadMessage(text);
    this.replyText = '';
  }
}
