import { ElementRef, HostListener, Component, inject, signal } from '@angular/core';
import { MessageService } from '../../../core/services/message.service'
import { ThreadHeader } from '../../../features/workspace/thread-panel/thread-header/thread-header'
import { ThreadInput } from '../../../features/workspace/thread-panel/thread-input/thread-input'
import { ThreadMessages } from '../../../features/workspace/thread-panel/thread-messages/thread-messages'
import { ReactionService } from '../../../core/services/reaction.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MessageView } from '../../../core/models/message-view.model';

@Component({
  selector: 'app-thread-panel',
  imports: [ThreadHeader, ThreadInput, ThreadMessages, PickerComponent],
  templateUrl: './thread-panel.html',
  styleUrl: './thread-panel.scss',
})
export class ThreadPanel {
  messageService = inject(MessageService);
  reactionService = inject(ReactionService);
  elementRef = inject(ElementRef);
  openedReactionPickerId = signal<string | null>(null);
  isMessageEdited = signal(false);
  editingThreadMessageId = signal<string | null>(null);
  editingThreadText = signal<string>('');

  toggleThreadEmojiPicker(messageId: string, event: Event): void {
    this.openedReactionPickerId.update((currentID) =>
      currentID === messageId ? null : messageId)
  }

async addThreadEmojiReaction(
  event: any,
  messageId: string
): Promise<void> {
  const emoji = event.emoji.native;

  await this.reactionService.addReaction(
    messageId,
    emoji,
    false
  );

  this.openedReactionPickerId.set(null);
}

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event: Event): void {
    const clickedOutside = this.elementRef.nativeElement.contains(event?.target)
    if (!clickedOutside) {
      this.openedReactionPickerId.set(null);
      this.isMessageEdited.set(false);
      this.cancelThreadEdit();
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape(): void {
    this.openedReactionPickerId.set(null);
    this.isMessageEdited.set(false);
    this.cancelThreadEdit();
  }

  toggleMessageEdited(): void {
    this.isMessageEdited.update(value => !value)
  }

  startEditingThreadMessage(reply: MessageView, event: Event): void {
    event.stopPropagation();

    this.editingThreadMessageId.set(reply.id);
    this.editingThreadText.set(reply.text);
    this.isMessageEdited.set(false);
  }

  cancelThreadEdit(): void {
    this.editingThreadMessageId.set(null);
    this.editingThreadText.set('');
  }

  async saveThreadEditedMessage(): Promise<void> {

    const messageId = this.editingThreadMessageId();

    if (!messageId) return;
    this.messageService.updateMessage(messageId, this.editingThreadText());

    this.editingThreadMessageId.set(null);
    this.editingThreadText.set('');
  }

  async saveOnEnter(event: KeyboardEvent): Promise<void> {
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.saveThreadEditedMessage();
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
}
