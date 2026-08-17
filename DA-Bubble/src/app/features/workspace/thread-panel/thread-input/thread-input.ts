import {Component, computed, ElementRef, HostListener, inject, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MessageService } from '../../../../core/services/message.service';
import { UserService } from '../../../../core/services/user.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { Profile } from '../../../../core/models/profile.model';
import { Channel } from '../../../../core/models/channel.model';

@Component({
  selector: 'app-thread-input',
  imports: [FormsModule, PickerComponent],
  templateUrl: './thread-input.html',
  styleUrl: './thread-input.scss',
})
export class ThreadInput {
  private messsageServis = inject(MessageService);
  private elementRef = inject(ElementRef);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  replyText = '';
  showEmojiPicker = false;
  mentionType = signal<'users' | 'channels' | null>(null);
  mentionSearchText = signal('');

  filteredMentionUsers = computed(() => {
    const search = this.mentionSearchText()
      .toLowerCase()
      .trim();

    const users = this.userService.user();

    if (!search) {
      return users;
    }

    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
    );
  });

  filteredMentionChannels = computed(() => {
    const search = this.mentionSearchText()
      .toLowerCase()
      .trim();

    const channels = this.channelService.channels();

    if (!search) {
      return channels;
    }

    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(search)
    );
  });

  handleEnter(event: KeyboardEvent): void {
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.sendReply();
  }

  onReplyInput(): void {
    const lastWord = this.replyText
      .split(/\s/)
      .pop() ?? '';

    if (lastWord.startsWith('@')) {
      this.mentionType.set('users');
      this.mentionSearchText.set(lastWord.slice(1));
      return;
    }

    if (lastWord.startsWith('#')) {
      this.mentionType.set('channels');
      this.mentionSearchText.set(lastWord.slice(1));
      return;
    }

    this.closeMentionDropdown();
  }

  toggleMentionButton(event: Event): void {
    event.stopPropagation();
    this.showEmojiPicker = false;

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
    const lastCharacter = this.replyText.at(-1);

    if (lastCharacter === '@' || lastCharacter === '#') {
      this.replyText =
        this.replyText.slice(0, -1) + character;
      return;
    }

    const separator =
      this.replyText.length > 0 &&
      !this.replyText.endsWith(' ')
        ? ' '
        : '';

    this.replyText =
      `${this.replyText}${separator}${character}`;
  }

  selectMentionUser(user: Profile): void {
    this.replaceLastMention(`@${user.name} `);
  }

  selectMentionChannel(channel: Channel): void {
    this.replaceLastMention(`#${channel.name} `);
  }

  private replaceLastMention(replacement: string): void {
    const lastAtIndex = this.replyText.lastIndexOf('@');
    const lastHashIndex = this.replyText.lastIndexOf('#');

    const mentionIndex = Math.max(
      lastAtIndex,
      lastHashIndex
    );

    if (mentionIndex === -1) {
      return;
    }

    const textBeforeMention =
      this.replyText.slice(0, mentionIndex);

    this.replyText =
      `${textBeforeMention}${replacement}`;

    this.closeMentionDropdown();
  }

  private closeMentionDropdown(): void {
    this.mentionType.set(null);
    this.mentionSearchText.set('');
  }

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event: MouseEvent): void {
    const threadClickedInside =
      this.elementRef.nativeElement.contains(event.target);

    if (!threadClickedInside) {
      this.showEmojiPicker = false;
      this.closeMentionDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape(): void {
    this.showEmojiPicker = false;
    this.closeMentionDropdown();
  }

  async sendReply(): Promise<void> {
    const text = this.replyText.trim();

    if (!text) {
      return;
    }

    await this.messsageServis.sendThreadMessage(text);

    this.replyText = '';
    this.showEmojiPicker = false;
    this.closeMentionDropdown();
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

    this.replyText += emoji;
    this.showEmojiPicker = false;
  }
}