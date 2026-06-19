import { ElementRef, HostListener, Component, inject } from '@angular/core';
import { MessageService } from '../../../../core/services/message.service';
import { FormsModule } from '@angular/forms';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


@Component({
  selector: 'app-message-input',
  imports: [FormsModule, PickerComponent],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput {
  private elementRef = inject(ElementRef);
  messageService = inject(MessageService);
  directMessageService = inject(DirectMessageService);
  channelService = inject(ChannelService)
  messageText: string = '';
  showEmojiPicker = false;

  async sendMessage(): Promise<void> {
    console.log('SEND CLICKED, messageText:', this.messageText);
    const text = this.messageText.trim();

    if (!text) return;


    if (this.directMessageService.currentDmUser()) {
      console.log('DM gönderiliyor');
      await this.directMessageService.sendDirectMessage(text);
    } else {
      console.log('Channel mesajı gönderiliyor');
      await this.messageService.sendMessage(text);
    }

    this.messageText = '';
  }

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.showEmojiPicker = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape(): void {
    this.showEmojiPicker = false;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native || event.emoji.colons || '';
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }

}
