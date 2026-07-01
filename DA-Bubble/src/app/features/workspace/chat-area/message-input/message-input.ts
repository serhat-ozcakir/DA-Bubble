import { ElementRef, HostListener, Component, inject, signal } from '@angular/core';
import { MessageService } from '../../../../core/services/message.service';
import { FormsModule } from '@angular/forms';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UserService } from '../../../../core/services/user.service';
import { Channel } from '../../../../core/models/channel.model';
import { Profile } from '../../../../core/models/profile.model';



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
  userService = inject(UserService);
  showMentionDropdown = signal(false);
  mentionType = signal<'user' | 'channel' | null>(null);
  mentionSearch = signal('');

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
      this.showMentionDropdown.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape(): void {
    this.showEmojiPicker = false;
    this.showMentionDropdown.set(false);
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native || event.emoji.colons || '';
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }

handleMentionInput(): void {
  const text = this.messageText;

  const lastAt = text.lastIndexOf('@');
  const lastHash = text.lastIndexOf('#');

  const isUserMention = lastAt > lastHash;
  const mentionStartIndex = isUserMention ? lastAt : lastHash;

  if (mentionStartIndex === -1) {
    this.closeMentionDropdown();
    return;
  }

  const trigger = text[mentionStartIndex];
  const searchText = text.slice(mentionStartIndex + 1);

  if (searchText.includes(' ')) {
    this.closeMentionDropdown();
    return;
  }

  this.mentionType.set(trigger === '@' ? 'user' : 'channel');
  this.mentionSearch.set(searchText.toLowerCase());
  this.showMentionDropdown.set(true);
}

closeMentionDropdown(): void {
  this.showMentionDropdown.set(false);
  this.mentionType.set(null);
  this.mentionSearch.set('');
}

filteredUsers(): Profile[] {
  const search = this.mentionSearch();

  return this.userService.user().filter(user =>
    user.name.toLowerCase().includes(search)
  );
}

filteredChannels(): Channel[] {
  const search = this.mentionSearch();

  return this.channelService.channels().filter(channel =>
    channel.name.toLowerCase().includes(search)
  );
}

  insertMention(type:'@' | '#'):void{
    this.messageText += type;

    if(type === '@'){
      this.mentionType.set('user');
    } else{
      this.mentionType.set('channel');
    }
    this.showMentionDropdown.set(true);
  }

selectUserMention(name: string): void {
  const lastAt = this.messageText.lastIndexOf('@');
  if (lastAt === -1) return;
  this.messageText =
    this.messageText.slice(0, lastAt) + `@${name} `;

  this.closeMentionDropdown();
}
selectChannelMention(name: string): void {
  const lastHash = this.messageText.lastIndexOf('#');
  if (lastHash === -1) return;
  this.messageText =
    this.messageText.slice(0, lastHash) + `#${name} `;

  this.closeMentionDropdown();
}

}
