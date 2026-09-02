import { afterNextRender, Component, computed, effect, ElementRef, inject, Injector, OnDestroy, OnInit, output, ViewChild, } from '@angular/core';
import { MessageItemComponent } from '../message-item/message-item';
import { MessageService } from '../../../../core/services/message.service';
import { Auth } from '../../../../core/services/auth.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { ReactionService } from '../../../../core/services/reaction.service';
import { MessageView } from '../../../../core/models/message-view.model';

@Component({
  selector: 'app-message-list',
  imports: [MessageItemComponent],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
})
export class MessageList implements OnInit, OnDestroy {
  messageService = inject(MessageService);
  directMessageService = inject(DirectMessageService);

  private authService = inject(Auth);
  private channelService = inject(ChannelService);
  private reactionService = inject(ReactionService);
  private injector = inject(Injector);

  // Tracks the previous message count to detect newly added messages.
  private previousMessageCount = 0;

  openProfile = output<void>();

  // Detects self-DMs so the message list can adapt
  // when the current user is also the conversation partner.
  isSelfDm = computed(() => {
    const dmUser = this.directMessageService.currentDmUser();
    const currentUser = this.authService.currentUserProfile();

    return !!dmUser &&
      !!currentUser &&
      dmUser.id === currentUser.id;
  });

  // Starts reaction synchronization and watches
  // the active DM/channel selection from component creation.
  constructor() {
    this.initializeReactionRealtime();
    this.watchConversationChanges();
    this.watchMessageChanges();
  }

  async ngOnInit(): Promise<void> {
    await this.authService.loadCurrentUser();
    await this.channelService.loadChannels();
  }

  // Removes the reaction realtime subscription when
  // the message list leaves the workspace view.
  ngOnDestroy(): void {
    this.reactionService.removeReactionsRealtimeChannel();
  }

  private initializeReactionRealtime(): void {
    this.reactionService.subscribeToReactions();
  }

  // Reacts to conversation changes and switches loading
  // and realtime behavior between DMs and channels.
  private watchConversationChanges(): void {
    effect(() => {
      const dmUser = this.directMessageService.currentDmUser();
      const channel = this.channelService.currentChannel();

      this.reactionService.loadReactions();

      if (dmUser) {
        void this.loadDirectConversation();
        return;
      }
      if (channel) void this.loadChannelConversation();
    });
  }

// Watches for new messages and controls auto-scroll behavior.
// Own messages always scroll down, while incoming messages only
// scroll when the user is already near the bottom.
private watchMessageChanges(): void {
  effect(() => {
    const messages = this.getMessages();
    const currentCount = messages.length;

    if (currentCount <= this.previousMessageCount) {
      this.previousMessageCount = currentCount;
      return;
    }
    const lastMessage = messages[currentCount - 1];
    const shouldScroll = lastMessage?.isOwnMessage || this.isNearBottom();
    this.previousMessageCount = currentCount;
    if (!shouldScroll) return;
    this.scrollAfterRender();
  });
}

  private async loadDirectConversation(): Promise<void> {
    await this.directMessageService.loadDirectMessages();
    this.directMessageService.listenToDirectMessages();
    this.scrollAfterRender();
  }

  // Stops the previous DM listener before switching
  // message loading and realtime updates back to a channel.
  private async loadChannelConversation(): Promise<void> {
    this.directMessageService.removeDmRealtimeChannel();
    await this.messageService.loadMessages();
    this.messageService.listenToMessages();
    this.scrollAfterRender();
  }

  getMessages(): MessageView[] {
    if (this.directMessageService.currentDmUser()) {
      return this.directMessageService.directMessages();
    }

    return this.messageService.messages();
  }

  // Shows a date separator for the first message
  // and whenever the calendar day changes.
  shouldShowDate(messages: MessageView[], index: number): boolean {
    if (index === 0) return true;

    const currentDate = this.getDateKey(messages[index].createdAt);
    const previousDate = this.getDateKey(messages[index - 1].createdAt);

    return currentDate !== previousDate;
  }

  formatMessageDate(dateString: string): string {
    const date = new Date(dateString);
    const relativeDate = this.getRelativeDateLabel(date);
    if (relativeDate) return relativeDate;
    return this.formatLongDate(date);
  }

  private getRelativeDateLabel(date: Date): string | null {
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (this.isSameDay(date, today)) return 'Heute';
    if (this.isSameDay(date, yesterday)) return 'Gestern';
    return null;
  }

  private formatLongDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }

  private getDateKey(dateString: string): string {
    const date = new Date(dateString);

    return [
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ].join('-');
  }

  private isSameDay(firstDate: Date, secondDate: Date): boolean {
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  }

  openUserProfile(): void {
    this.openProfile.emit();
  }

  @ViewChild('messageList')
  private messageListRef!: ElementRef<HTMLDivElement>;

  // Moves the message list to the latest message.
  private scrollToBottom(): void {
    const messageList = this.messageListRef.nativeElement;
    messageList.scrollTop = messageList.scrollHeight;
  }
  
  // Checks whether the user is close enough to the bottom
  // to keep following incoming messages automatically.
  private isNearBottom(): boolean {
    const messageList = this.messageListRef.nativeElement;
    const distanceFromBottom  = 
    messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;  
    return distanceFromBottom < 120;
  }

  // Waits for Angular to render new messages before scrolling,
  // so the latest scroll height is available.
  private scrollAfterRender(): void {
    afterNextRender(
      () => this.scrollToBottom(),
      { injector: this.injector },
    );
  }


}