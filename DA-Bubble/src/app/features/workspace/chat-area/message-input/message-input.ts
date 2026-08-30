import {Component, ElementRef, HostListener, inject, signal,} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MessageService } from '../../../../core/services/message.service';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { ChannelService } from '../../../../core/services/channel.service';
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
  channelService = inject(ChannelService);
  userService = inject(UserService);
  messageText = '';
  showEmojiPicker = false;
  mentionType = signal<'users' | 'channels' | null>(null);
  mentionSearchText = signal('');

  handleEnter(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  // Clears the input optimistically and restores the message
  // if sending fails.
  async sendMessage(): Promise<void> {
    const text = this.messageText.trim();
    if (!text) return;

    this.messageText = '';

    try {
      await this.sendToCurrentConversation(text);
      this.closeMentionDropdown();
    } catch (error) {
      this.handleSendError(error, text);
    }
  }

  // Routes the message to the active DM or channel
  // while keeping a shared input component.
  private async sendToCurrentConversation(text: string): Promise<void> {
    if (this.directMessageService.currentDmUser()) {
      await this.directMessageService.sendDirectMessage(text);
      return;
    }
    await this.messageService.sendMessage(text);
  }

  private handleSendError(error: unknown, text: string): void {
    console.error('Message could not be sent:', error);
    this.messageText = text;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.closeMentionDropdown();
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native || event.emoji.colons || '';
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }

  // Opens the matching mention suggestions when the
  // current word starts with @ or #.
  onMessageInput(): void {
    const lastWord = this.getLastWord();

    if (lastWord.startsWith('@')) {
      this.openMention('users', lastWord);
      return;
    }
    if (lastWord.startsWith('#')) {
      this.openMention('channels', lastWord);
      return;
    }
    this.closeMentionDropdown();
  }

  private getLastWord(): string {
    return this.messageText.split(' ').pop() ?? '';
  }

  private openMention(type: 'users' | 'channels', word: string): void {
    this.mentionType.set(type);
    this.mentionSearchText.set(word.slice(1).toLowerCase());
  }

  toggleMentionButton(): void {
    if (this.mentionType() === 'users') {
      this.switchToChannelMention();
      return;
    }
    this.switchToUserMention();
  }

  private switchToUserMention(): void {
    this.replaceOrAddMentionCharacter('@');
    this.setMentionType('users');
  }

  private switchToChannelMention(): void {
    this.replaceOrAddMentionCharacter('#');
    this.setMentionType('channels');
  }

  private setMentionType(type: 'users' | 'channels'): void {
    this.mentionType.set(type);
    this.mentionSearchText.set('');
  }

  // Replaces an existing mention prefix when switching types,
  // otherwise starts a new mention at the end of the text.
  private replaceOrAddMentionCharacter(character: '@' | '#'): void {
    const currentText = this.messageText;

    if (this.endsWithMentionCharacter(currentText)) {
      this.replaceLastCharacter(currentText, character);
      return;
    }
    this.appendMentionCharacter(currentText, character);
  }

  private endsWithMentionCharacter(text: string): boolean {
    const lastCharacter = text.at(-1);
    return lastCharacter === '@' || lastCharacter === '#';
  }

  private replaceLastCharacter(text: string, character: '@' | '#'): void {
    this.messageText = text.slice(0, -1) + character;
  }

  private appendMentionCharacter(text: string, character: '@' | '#'): void {
    const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
    this.messageText = `${text}${separator}${character}`;
  }

  filteredUsers(): Profile[] {
    const search = this.mentionSearchText();
    const users = this.userService.user();

    if (!search) return users;

    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
    );
  }

  filteredChannels(): Channel[] {
    const search = this.mentionSearchText();
    const channels = this.channelService.channels();

    if (!search) return channels;

    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(search)
    );
  }

  selectUserMention(user: Profile): void {
    this.replaceCurrentMention(`@${user.name} `);
  }

  selectChannelMention(channel: Channel): void {
    this.replaceCurrentMention(`#${channel.name} `);
  }

  // Replaces only the active mention token and preserves
  // the rest of the composed message.
  private replaceCurrentMention(replacement: string): void {
    const words = this.messageText.split(' ');
    words[words.length - 1] = replacement.trimEnd();
    this.messageText = `${words.join(' ')} `;
    this.closeMentionDropdown();
  }

  closeMentionDropdown(): void {
    this.mentionType.set(null);
    this.mentionSearchText.set('');
  }

  // Dismisses open emoji and mention pickers when the user
  // clicks outside the input or presses Escape.
  @HostListener('document:click', ['$event'])
  closePickersOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.closeAllPickers();
    }
  }

  @HostListener('document:keydown.escape')
  closePickersOnEscape(): void {
    this.closeAllPickers();
  }

  private closeAllPickers(): void {
    this.showEmojiPicker = false;
    this.closeMentionDropdown();
  }
}