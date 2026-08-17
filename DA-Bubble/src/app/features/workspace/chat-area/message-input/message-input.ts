import {ElementRef, HostListener, Component, inject, signal} from '@angular/core';
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

  async sendMessage(): Promise<void> {
    const text = this.messageText.trim();

    if (!text) {
      return;
    }

    this.messageText = '';

    try {
      if (this.directMessageService.currentDmUser()) {
        await this.directMessageService.sendDirectMessage(text);
      } else {
        await this.messageService.sendMessage(text);
      }

      this.closeMentionDropdown();
    } catch (error) {
      console.error(
        'Message could not be sent:',
        error
      );

      this.messageText = text;
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.closeMentionDropdown();
  }

  addEmoji(event: any): void {
    const emoji =
      event.emoji.native ||
      event.emoji.colons ||
      '';

    this.messageText += emoji;
    this.showEmojiPicker = false;
  }

  onMessageInput(): void {
    const lastWord =
      this.messageText.split(' ').pop() ?? '';

    if (lastWord.startsWith('@')) {
      this.mentionType.set('users');
      this.mentionSearchText.set(
        lastWord.slice(1).toLowerCase()
      );
      return;
    }

    if (lastWord.startsWith('#')) {
      this.mentionType.set('channels');
      this.mentionSearchText.set(
        lastWord.slice(1).toLowerCase()
      );
      return;
    }

    this.closeMentionDropdown();
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

    this.mentionType.set('users');
    this.mentionSearchText.set('');
  }

  private switchToChannelMention(): void {
    this.replaceOrAddMentionCharacter('#');

    this.mentionType.set('channels');
    this.mentionSearchText.set('');
  }

  private replaceOrAddMentionCharacter(
    character: '@' | '#'
  ): void {
    const currentText = this.messageText;
    const lastCharacter = currentText.at(-1);

    if (
      lastCharacter === '@' ||
      lastCharacter === '#'
    ) {
      this.messageText =
        currentText.slice(0, -1) +
        character;

      return;
    }

    const separator =
      currentText.length > 0 &&
      !currentText.endsWith(' ')
        ? ' '
        : '';

    this.messageText =
      `${currentText}${separator}${character}`;
  }

  filteredUsers(): Profile[] {
    const search =
      this.mentionSearchText();

    const users =
      this.userService.user();

    if (!search) {
      return users;
    }

    return users.filter((user) =>
      user.name
        .toLowerCase()
        .includes(search)
    );
  }

  filteredChannels(): Channel[] {
    const search =
      this.mentionSearchText();

    const channels =
      this.channelService.channels();

    if (!search) {
      return channels;
    }

    return channels.filter((channel) =>
      channel.name
        .toLowerCase()
        .includes(search)
    );
  }

  selectUserMention(user: Profile): void {
    this.replaceCurrentMention(
      `@${user.name} `
    );
  }

  selectChannelMention(channel: Channel): void {
    this.replaceCurrentMention(
      `#${channel.name} `
    );
  }

  private replaceCurrentMention(
    replacement: string
  ): void {
    const words =
      this.messageText.split(' ');

    words[words.length - 1] =
      replacement.trimEnd();

    this.messageText =
      `${words.join(' ')} `;

    this.closeMentionDropdown();
  }

  closeMentionDropdown(): void {
    this.mentionType.set(null);
    this.mentionSearchText.set('');
  }

  @HostListener(
    'document:click',
    ['$event']
  )
  closePickersOnOutsideClick(
    event: MouseEvent
  ): void {
    const clickedInside =
      this.elementRef.nativeElement
        .contains(event.target);

    if (!clickedInside) {
      this.showEmojiPicker = false;
      this.closeMentionDropdown();
    }
  }

  @HostListener(
    'document:keydown.escape'
  )
  closePickersOnEscape(): void {
    this.showEmojiPicker = false;
    this.closeMentionDropdown();
  }
}