import { HostListener, ElementRef, Component, computed, inject, signal, output } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { Profile } from '../../../../core/models/profile.model';
import { Channel } from '../../../../core/models/channel.model';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { MessageService } from '../../../../core/services/message.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

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
  recipientSearchText = signal('');
  isRecipientDropdownOpen = signal(false);
  selectedUser = signal<Profile | null>(null);
  selectedChannel = signal<Channel | null>(null);
  private elementRef = inject(ElementRef);
  messageText = signal('');
  isSending = signal(false);
  isErrorMessage = signal('');
  messageSent = output<void>();
  showEmojiPicker = signal(false);
  mentionType = signal<'users' | 'channels' | null>(null);
  mentionSearchText = signal('');

  toggleEmojiPicker(event: Event): void {
    event.stopPropagation();
    this.showEmojiPicker.update((emoji) => !emoji)
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
    const currentText = this.messageText();
    const lastCharacter = currentText.at(-1);

    if (lastCharacter === '@' || lastCharacter === '#') {
      this.messageText.set(
        currentText.slice(0, -1) + character
      );
      return;
    }

    const separator =
      currentText.length > 0 && !currentText.endsWith(' ')
        ? ' '
        : '';

    this.messageText.set(
      `${currentText}${separator}${character}`
    );
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native || event.emoji.colons || '';
    this.messageText.update((text) => text + emoji)
    this.showEmojiPicker.set(false);
  }

  recipientMode = computed<'users' | 'channels'>(() => {
    const search = this.recipientSearchText().trim();

    if (search.startsWith('#')) {
      return 'channels'
    }
    return 'users';
  })

  filteredUsers = computed(() => {
    const search = this.recipientSearchText().toLowerCase().trim().replace(/^@/, '');
    const users = this.userService.user();
    if (!search) {
      return users;
    }
    return users.filter((user) =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    )
  })

  filteredChannels = computed(() => {
    const search = this.recipientSearchText().toLowerCase().trim().replace(/^#/, '');
    const channels = this.channelService.channels();

    if (!search) {
      return channels;
    }

    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(search))
  })

filteredMentionUsers = computed(() => {
  const search = this.mentionSearchText().toLowerCase().trim();
  const users = this.userService.user();

  if (!search) {
    return users;
  }

  return users.filter((user) =>
    user.name.toLowerCase().includes(search)
  );
});

filteredMentionChannels = computed(() => {
  const search = this.mentionSearchText().toLowerCase().trim();
  const channels = this.channelService.channels();

  if (!search) {
    return channels;
  }

  return channels.filter((channel) =>
    channel.name.toLowerCase().includes(search)
  );
});

selectMentionUser(user: Profile): void {
  this.replaceLastMention(`@${user.name} `);
}

selectMentionChannel(channel: Channel): void {
  this.replaceLastMention(`#${channel.name} `);
}

private replaceLastMention(replacement: string): void {
  const currentText = this.messageText();

  const lastAtIndex = currentText.lastIndexOf('@');
  const lastHashIndex = currentText.lastIndexOf('#');

  const mentionIndex = Math.max(lastAtIndex, lastHashIndex);

  if (mentionIndex === -1) {
    return;
  }

  const textBeforeMention = currentText.slice(0, mentionIndex);

  this.messageText.set(
    `${textBeforeMention}${replacement}`
  );

  this.closeMentionDropdown();
}

private closeMentionDropdown(): void {
  this.mentionType.set(null);
  this.mentionSearchText.set('');
}

  openRecipientDropdown(): void {
    if (this.selectedUser() || this.selectedChannel()) {
      return;
    }

    this.isRecipientDropdownOpen.set(true);
  }

  onRecipientInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.recipientSearchText.set(input.value);
    this.isRecipientDropdownOpen.set(true);
  }

  selectUser(user: Profile): void {
    this.selectedUser.set(user);
    this.selectedChannel.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(false);
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel.set(channel);
    this.selectedUser.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(false);
  }

  clearRecipient(): void {
    this.selectedUser.set(null);
    this.selectedChannel.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.isRecipientDropdownOpen.set(false);
      this.showEmojiPicker.set(false);
      this.closeMentionDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  closeUserMenuOnEscape(): void {
    this.isRecipientDropdownOpen.set(false);
    this.showEmojiPicker.set(false);
    this.closeMentionDropdown();
  }

onMessageInput(event: Event): void {
  const textarea = event.target as HTMLTextAreaElement;
  const value = textarea.value;

  this.messageText.set(value);

  const lastWord = value.split(/\s/).pop() ?? '';

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

  async sendMessage(): Promise<void> {
    const text = this.messageText().trim();
    const selectedUser = this.selectedUser();
    const selectedChannel = this.selectedChannel();

    if (!text || (!selectedUser && !selectedChannel)) {
      return;
    }

    this.isSending.set(true);
    this.isErrorMessage.set('');

    try {
      if (selectedChannel) {
        this.directMessageService.currentDmUser.set(null);
        this.channelService.setCurrentChannel(selectedChannel);

        await this.messageService.sendMessage(text);
      } else if (selectedUser) {
        await this.directMessageService.selectDmUser(selectedUser);
        await this.directMessageService.sendDirectMessage(text);
      }

      this.messageText.set('');
      this.openSelectedChat();
    } catch (error) {
      console.error('The message could not be sent:', error);

      this.isErrorMessage.set(
        'The message could not be sent.'
      );
    } finally {
      this.isSending.set(false);
    }
  }

  private openSelectedChat(): void {
    this.messageSent.emit();
  }
}
