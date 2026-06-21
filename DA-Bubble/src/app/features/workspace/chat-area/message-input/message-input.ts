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

  handleEnter(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    const text = this.messageText.trim();

    if (!text) return;
    this.messageText = '';

    try {
      if (this.directMessageService.currentDmUser()) {
        await this.directMessageService.sendDirectMessage(text);
      } else {
        await this.messageService.sendMessage(text);
      }
    } catch (error) {
      console.error('Message could not be sent:', error);
      this.messageText = text;
    }
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
