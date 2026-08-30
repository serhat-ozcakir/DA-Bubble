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
  private messageService = inject(MessageService);
  private elementRef = inject(ElementRef);
  userService = inject(UserService);
  channelService = inject(ChannelService);

  replyText = '';
  showEmojiPicker = false;

  mentionType = signal<'users' | 'channels' | null>(null);
  mentionSearchText = signal('');

  filteredMentionUsers = computed(() => {
    const search = this.getMentionSearch();
    const users = this.userService.user();
    if (!search) return users;
    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
    );
  });

  filteredMentionChannels = computed(() => {
    const search = this.getMentionSearch();
    const channels = this.channelService.channels();
    if (!search) return channels;
    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(search)
    );
  });

  // Sends the reply with Enter while keeping
  // Shift+Enter available for multiline text.
  handleEnter(event: KeyboardEvent): void {
    if (event.shiftKey) return;
    event.preventDefault();
    this.sendReply();
  }

  // Opens user or channel mention suggestions based on
  // the prefix of the word currently being typed.
  onReplyInput(): void {
    const lastWord = this.getLastWord();

    if (lastWord.startsWith('@')) {
      this.setMentionSearch('users', lastWord.slice(1));
      return;
    }
    if (lastWord.startsWith('#')) {
      this.setMentionSearch('channels', lastWord.slice(1));
      return;
    }
    this.closeMentionDropdown();
  }

  private getLastWord(): string {
    return this.replyText
      .split(/\s/)
      .pop() ?? '';
  }

  private setMentionSearch(type: 'users' | 'channels', search: string): void {
    this.mentionType.set(type);
    this.mentionSearchText.set(search);
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
    this.activateMention('@', 'users');
  }

  private switchToChannelMention(): void {
    this.activateMention('#', 'channels');
  }

  private activateMention(character: '@' | '#', type: 'users' | 'channels'): void {
    this.replaceOrAddMentionCharacter(character);
    this.mentionType.set(type);
    this.mentionSearchText.set('');
  }

  // Replaces an existing mention prefix when switching types,
  // otherwise starts a new mention at the end of the reply.
  private replaceOrAddMentionCharacter(character: '@' | '#'): void {
    if (this.hasTrailingMentionCharacter()) {
      this.replaceTrailingCharacter(character);
      return;
    }
    this.appendMentionCharacter(character);
  }

  private hasTrailingMentionCharacter(): boolean {
    const lastCharacter = this.replyText.at(-1);
    return lastCharacter === '@' || lastCharacter === '#';
  }

  private replaceTrailingCharacter(character: '@' | '#'): void {
    this.replyText = this.replyText.slice(0, -1) + character;
  }

  private appendMentionCharacter(character: '@' | '#'): void {
    const separator = this.getMentionSeparator();
    this.replyText =`${this.replyText}${separator}${character}`;
  }

  private getMentionSeparator(): string {
    return this.replyText.length > 0 &&
      !this.replyText.endsWith(' ')
      ? ' '
      : '';
  }

  selectMentionUser(user: Profile): void {
    this.replaceLastMention(`@${user.name} `);
  }

  selectMentionChannel(channel: Channel): void {
    this.replaceLastMention(`#${channel.name} `);
  }

  // Replaces only the active mention and preserves
  // the reply content written before it.
  private replaceLastMention(replacement: string): void {
    const mentionIndex = this.getLastMentionIndex();
    if (mentionIndex === -1) return;
    const textBeforeMention = this.replyText.slice(0, mentionIndex);
    this.replyText = `${textBeforeMention}${replacement}`;
    this.closeMentionDropdown();
  }

  private getLastMentionIndex(): number {
    const lastAtIndex = this.replyText.lastIndexOf('@');
    const lastHashIndex = this.replyText.lastIndexOf('#');
    return Math.max(lastAtIndex, lastHashIndex);
  }

  private closeMentionDropdown(): void {
    this.mentionType.set(null);
    this.mentionSearchText.set('');
  }

  @HostListener('document:click', ['$event'])
  closeOverlaysOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) this.closeOverlays();
  }

  @HostListener('document:keydown.escape')
  closeOverlaysOnEscape(): void {
    this.closeOverlays();
  }

  private closeOverlays(): void {
    this.showEmojiPicker = false;
    this.closeMentionDropdown();
  }

  // Sends the reply through the thread message flow
  // and resets the composer only after a successful request.
  async sendReply(): Promise<void> {
    const text = this.replyText.trim();
    if (!text) return;
    await this.messageService.sendThreadMessage(text);
    this.resetInput();
  }

  private resetInput(): void {
    this.replyText = '';
    this.showEmojiPicker = false;
    this.closeMentionDropdown();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.closeMentionDropdown();
  }

  addEmoji(event: any): void {
    const emoji =  event.emoji.native || event.emoji.colons || '';
    this.replyText += emoji;
    this.showEmojiPicker = false;
  }

  private getMentionSearch(): string {
    return this.mentionSearchText()
      .toLowerCase()
      .trim();
  }
}