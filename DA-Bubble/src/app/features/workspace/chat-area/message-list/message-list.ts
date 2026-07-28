import { Component,effect,inject, OnDestroy,} from '@angular/core';
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
export class MessageList implements OnDestroy {
  messageService = inject(MessageService);

  private authService = inject(Auth);
  private channelService = inject(ChannelService);
  private reactionService = inject(ReactionService);

  directMessageService = inject(DirectMessageService);

  constructor() {
    this.reactionService.subscribeToReactions();

    effect(() => {
      const dmUser = this.directMessageService.currentDmUser();
      const channel = this.channelService.currentChannel();

      this.reactionService.loadReactions();

      if (dmUser) {
        this.directMessageService.loadDirectMessages();
        this.directMessageService.listenToDirectMessages();
        return;
      }

      if (channel) {
        this.directMessageService.removeDmRealtimeChannel();
        this.messageService.loadMessages();
        this.messageService.listenToMessages();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.authService.loadCurrentUser();
    await this.channelService.loadChannels();
  }

  ngOnDestroy(): void {
    this.reactionService.removeReactionsRealtimeChannel();
  }

  getMessages(): MessageView[] {
  if (this.directMessageService.currentDmUser()) {
    return this.directMessageService.directMessages();
  }

  return this.messageService.messages();
}

shouldShowDate(
  messages: MessageView[],
  index: number
): boolean {
  if (index === 0) {
    return true;
  }

  const currentDate = this.getDateKey(
    messages[index].createdAt
  );

  const previousDate = this.getDateKey(
    messages[index - 1].createdAt
  );

  return currentDate !== previousDate;
}

formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (this.isSameDay(date, today)) {
    return 'Heute';
  }

  if (this.isSameDay(date, yesterday)) {
    return 'Gestern';
  }

  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

private getDateKey(dateString: string): string {
  const date = new Date(dateString);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

private isSameDay(
  firstDate: Date,
  secondDate: Date
): boolean {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}
}