import { ElementRef, HostListener, Component, inject, input, Input, signal } from '@angular/core';
import { MessageView } from '../../../../core/models/message-view.model';
import { MessageService } from '../../../../core/services/message.service';
import { ReactionService } from '../../../../core/services/reaction.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { FormsModule } from '@angular/forms';
import { ReactionSummary } from '../../../../core/models/reaction-summary.model';
import { DirectMessageService } from '../../../../core/services/direct-message.service';


@Component({
  selector: 'app-message-item',
  imports: [PickerComponent, FormsModule],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItemComponent {

  message = input.required<MessageView>();
  private messageService = inject(MessageService);
  directMessageService = inject(DirectMessageService);
  reactionService = inject(ReactionService);
  isShowEmojiPicker = signal(false);
  private elementRef = inject(ElementRef);
  isMessageEdited = signal(false);
  editingMessageID = signal<string | null>(null);
  editingText = signal<string>('');
  readonly desktopReactionLimit = 20;
  readonly mobileReactionLimit = 7;
  isMobile = signal(window.innerWidth <= 1024);
  expandedReactionMessageIds = signal<Set<string>>(new Set());

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth <= 1024);
  }

  getReactionLimit(): number {
    return this.isMobile()
      ? this.mobileReactionLimit
      : this.desktopReactionLimit;
  }

getVisibleReactions(messageId: string): ReactionSummary[] {
  const reactions =
    this.reactionService.getReactionForMessage(messageId);

  if (this.expandedReactionMessageIds().has(messageId)) {
    return reactions;
  }

  return this.reactionService.getLimitedReactionsForMessage(
    messageId,
    this.getReactionLimit()
  );
}

  getTotalReactionCount(messageId: string): number {
    return this.reactionService.getReactionForMessage(messageId).length;
  }

getHiddenReactionCount(messageId: string): number {
  if (this.expandedReactionMessageIds().has(messageId)) {
    return 0;
  }

  return Math.max(0,this.getTotalReactionCount(messageId) - this.getReactionLimit()
  );
}

  toggleAllReactions(messageId: string): void {
  this.expandedReactionMessageIds.update((current) => {
    const updated = new Set(current);

    if (updated.has(messageId)) {
      updated.delete(messageId);
    } else {
      updated.add(messageId);
    }

    return updated;
  });
}

isReactionExpanded(messageId: string): boolean {
  return this.expandedReactionMessageIds().has(messageId);
}

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.isShowEmojiPicker.set(false);
      this.isMessageEdited.set(false);

    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape(): void {
    this.isShowEmojiPicker.set(false);
    this.isMessageEdited.set(false);
    this.cancelEditMessage();
  }

  openThread(): void {
    const isDirectMessage = this.directMessageService.currentDmUser() !== null;
    if (isDirectMessage) {
      return;
    }
    this.messageService.openThread(this.message())
  }

  toggleEmojiPicker(): void {
    this.isShowEmojiPicker.update(value => !value)
  }
  async addEmojiReaction(event: any): Promise<void> {
    const emoji = event.emoji.native;

    const isDirectMessage =
      this.directMessageService.currentDmUser() !== null;

    await this.reactionService.addReaction(
      this.message().id,
      emoji,
      isDirectMessage
    );

    this.isShowEmojiPicker.set(false);
  }

  toggleMessageEdited(event: Event): void {
    event.stopPropagation();
    this.isMessageEdited.update(value => !value)
  }

  startEditingMessage(event: Event): void {
    console.log('edit:', this.message().id);
    event.stopPropagation();
    this.editingMessageID.set(this.message().id);
    this.editingText.set(this.message().text);
    this.isMessageEdited.set(false);
  }

  cancelEditMessage(): void {
    this.editingMessageID.set(null);
    this.editingText.set('');
  }

  async saveEditedMessage(): Promise<void> {
    const newText = this.editingText().trim();
    const currentMessage = this.message();

    if (!newText || newText === currentMessage.text) {
      this.cancelEditMessage();
      return;
    }

    if (this.directMessageService.currentDmUser()) {
      await this.directMessageService.updateDirectMessage(
        currentMessage.id,
        newText
      );
    } else {
      await this.messageService.updateMessage(
        currentMessage.id,
        newText
      );
    }

    this.cancelEditMessage();
  }

  async saveOnEnter(event: KeyboardEvent): Promise<void> {
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    await this.saveEditedMessage();
  }

  getReactionUsersNames(userNames: string[]): string {
    if (userNames.length === 1) {
      return userNames[0];
    }
    if (userNames.length === 2) {
      return `${userNames[0]} und ${userNames[1]}`
    }
    return `${userNames[0]} und ${userNames[1]} und ${userNames.length - 2} weitere`
  }

  getReactionVerb(userNames: string[]): string {
    return userNames.length === 1 ? 'hat reagiert' : 'haben reagiert'
  }

  async toggleQuickReaction(emoji: string): Promise<void> {
    const isDirectMessage =
      this.directMessageService.currentDmUser() !== null;

    await this.reactionService.addReaction(
      this.message().id,
      emoji,
      isDirectMessage
    );
  }
}
