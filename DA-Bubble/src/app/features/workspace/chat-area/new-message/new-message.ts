import {Component, computed, ElementRef, HostListener, inject, output, signal,} from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UserService } from '../../../../core/services/user.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { MessageService } from '../../../../core/services/message.service';
import { Profile } from '../../../../core/models/profile.model';
import { Channel } from '../../../../core/models/channel.model';

@Component({
  selector: 'app-new-message',
  imports: [PickerComponent],
  templateUrl: './new-message.html',
  styleUrl: './new-message.scss',
})

export class NewMessage {
  userService = inject(UserService);
  channelService = inject(ChannelService);
  messageService = inject(MessageService);
  directMessageService = inject(DirectMessageService);

  private elementRef = inject(ElementRef);

  recipientSearchText = signal('');
  isRecipientDropdownOpen = signal(false);
  selectedUser = signal<Profile | null>(null);
  selectedChannel = signal<Channel | null>(null);

  messageText = signal('');
  isSending = signal(false);
  isErrorMessage = signal('');
  showEmojiPicker = signal(false);

  mentionType = signal<'users' | 'channels' | null>(null);
  mentionSearchText = signal('');

  messageSent = output<void>();

  // Uses # to switch recipient search from users
  // to channels while keeping a single search field.
  recipientMode = computed<'users' | 'channels'>(() => {
    const search = this.recipientSearchText().trim();
    return search.startsWith('#') ? 'channels' : 'users';
  });

  filteredUsers = computed(() => {
    const search = this.getRecipientSearch('@');
    const users = this.userService.user();

    if (!search) return users;

    return users.filter((user) =>
      this.userMatchesSearch(user, search)
    );
  });

  filteredChannels = computed(() => {
    const search = this.getRecipientSearch('#');
    const channels = this.channelService.channels();

    if (!search) return channels;

    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(search)
    );
  });

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

  toggleEmojiPicker(event: Event): void {
    event.stopPropagation();
    this.showEmojiPicker.update((isOpen) => !isOpen);
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native || event.emoji.colons || '';
    this.messageText.update((text) => text + emoji);
    this.showEmojiPicker.set(false);
  }

  toggleMentionButton(event: Event): void {
    event.stopPropagation();

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
  // otherwise starts a new mention at the end of the text.
  private replaceOrAddMentionCharacter(character: '@' | '#'): void {
    const text = this.messageText();

    if (this.hasTrailingMentionCharacter(text)) {
      this.replaceTrailingCharacter(text, character);
      return;
    }
    this.appendMentionCharacter(text, character);
  }

  private hasTrailingMentionCharacter(text: string): boolean {
    const lastCharacter = text.at(-1);
    return lastCharacter === '@' || lastCharacter === '#';
  }

  private replaceTrailingCharacter(text: string, character: '@' | '#'): void {
    this.messageText.set(text.slice(0, -1) + character);
  }

  private appendMentionCharacter(text: string, character: '@' | '#'): void {
    const separator = this.getMentionSeparator(text);
    this.messageText.set(`${text}${separator}${character}`);
  }

  private getMentionSeparator(text: string): string {
    return text.length > 0 && !text.endsWith(' ') ? ' ' : '';
  }

  selectMentionUser(user: Profile): void {
    this.replaceLastMention(`@${user.name} `);
  }

  selectMentionChannel(channel: Channel): void {
    this.replaceLastMention(`#${channel.name} `);
  }

  // Replaces only the active mention while preserving
  // the message content written before it.
  private replaceLastMention(replacement: string): void {
    const currentText = this.messageText();
    const mentionIndex = this.getLastMentionIndex(currentText);

    if (mentionIndex === -1) return;

    const textBeforeMention = currentText.slice(0, mentionIndex);
    this.messageText.set(`${textBeforeMention}${replacement}`);
    this.closeMentionDropdown();
  }

  private getLastMentionIndex(text: string): number {
    const lastAtIndex = text.lastIndexOf('@');
    const lastHashIndex = text.lastIndexOf('#');
    return Math.max(lastAtIndex, lastHashIndex);
  }

  private closeMentionDropdown(): void {
    this.mentionType.set(null);
    this.mentionSearchText.set('');
  }

  openRecipientDropdown(): void {
    if (this.hasSelectedRecipient()) return;
    this.isRecipientDropdownOpen.set(true);
  }

  private hasSelectedRecipient(): boolean {
    return !!this.selectedUser() || !!this.selectedChannel();
  }

  onRecipientInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.recipientSearchText.set(input.value);
    this.isRecipientDropdownOpen.set(true);
  }

  // Keeps user and channel recipients mutually exclusive;
  // selecting one always clears the other.
  selectUser(user: Profile): void {
    this.selectedUser.set(user);
    this.selectedChannel.set(null);
    this.closeRecipientSelection();
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel.set(channel);
    this.selectedUser.set(null);
    this.closeRecipientSelection();
  }

  private closeRecipientSelection(): void {
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(false);
  }

  clearRecipient(): void {
    this.selectedUser.set(null);
    this.selectedChannel.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(true);
  }

  onMessageInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;

    this.messageText.set(value);
    this.updateMentionSearch(value);
  }

  private updateMentionSearch(value: string): void {
    const lastWord = value.split(/\s/).pop() ?? '';

    if (lastWord.startsWith('@')) {
      this.setMentionSearch('users', lastWord.slice(1));
      return;
    }
    this.updateChannelMentionSearch(lastWord);
  }

  private updateChannelMentionSearch(lastWord: string): void {
    if (lastWord.startsWith('#')) {
      this.setMentionSearch('channels', lastWord.slice(1));
      return;
    }
    this.closeMentionDropdown();
  }

  private setMentionSearch(type: 'users' | 'channels',search: string): void {
    this.mentionType.set(type);
    this.mentionSearchText.set(search);
  }

  // Dismisses recipient, emoji and mention overlays when
  // the user clicks outside or presses Escape.
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
    this.isRecipientDropdownOpen.set(false);
    this.showEmojiPicker.set(false);
    this.closeMentionDropdown();
  }

  async sendMessage(): Promise<void> {
    const text = this.messageText().trim();

    if (!this.canSendMessage(text)) return;
    this.startSending();

    try {
      await this.sendToSelectedRecipient(text);
      this.finishSuccessfulSend();
    } catch (error) {
      this.handleSendError(error);
    } finally {
      this.isSending.set(false);
    }
  }

  private canSendMessage(text: string): boolean {
    return !!text && this.hasSelectedRecipient();
  }

  private startSending(): void {
    this.isSending.set(true);
    this.isErrorMessage.set('');
  }

  // Routes the message to the selected channel or user
  // while keeping both flows behind one compose screen.
  private async sendToSelectedRecipient(text: string): Promise<void> {
    const channel = this.selectedChannel();

    if (channel) {
      await this.sendChannelMessage(channel, text);
      return;
    }
    await this.sendDirectMessage(text);
  }

  // Switches the workspace from DM mode to the selected
  // channel before sending through the shared message service.
  private async sendChannelMessage(channel: Channel,text: string): Promise<void> {
    this.directMessageService.currentDmUser.set(null);
    this.channelService.setCurrentChannel(channel);
    await this.messageService.sendMessage(text);
  }

  // Activates the selected DM conversation before sending
  // so message state and realtime listeners target that user.
  private async sendDirectMessage(text: string): Promise<void> {
    const user = this.selectedUser();
    if (!user) return;

    await this.directMessageService.selectDmUser(user);
    await this.directMessageService.sendDirectMessage(text);
  }

  private finishSuccessfulSend(): void {
    this.messageText.set('');
    this.openSelectedChat();
  }

  private handleSendError(error: unknown): void {
    console.error('The message could not be sent:', error);
    this.isErrorMessage.set('The message could not be sent.');
  }

  private openSelectedChat(): void {
    this.messageSent.emit();
  }

  private getRecipientSearch(prefix: '@' | '#'): string {
    return this.recipientSearchText()
      .toLowerCase()
      .trim()
      .replace(new RegExp(`^\\${prefix}`), '');
  }

  private getMentionSearch(): string {
    return this.mentionSearchText().toLowerCase().trim();
  }

  private userMatchesSearch(user: Profile, search: string): boolean {
    const nameMatches = user.name.toLowerCase().includes(search);
    const emailMatches =user.email?.toLowerCase().includes(search) ?? false;
    return nameMatches || emailMatches;
  }
}