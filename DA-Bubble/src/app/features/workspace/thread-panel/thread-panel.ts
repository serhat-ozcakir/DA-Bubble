import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MessageService } from '../../../core/services/message.service';
import { ReactionService } from '../../../core/services/reaction.service';
import { MessageView } from '../../../core/models/message-view.model';
import { ReactionSummary } from '../../../core/models/reaction-summary.model';
import { ThreadHeader } from './thread-header/thread-header';
import { ThreadInput } from './thread-input/thread-input';

@Component({
  selector: 'app-thread-panel',
  imports: [ThreadHeader, ThreadInput, PickerComponent],
  templateUrl: './thread-panel.html',
  styleUrl: './thread-panel.scss',
})

export class ThreadPanel {
  messageService = inject(MessageService);
  reactionService = inject(ReactionService);
  private elementRef = inject(ElementRef);

  openedReactionPickerId = signal<string | null>(null);
  isMessageEdited = signal(false);
  editingThreadMessageId = signal<string | null>(null);
  editingThreadText = signal('');
  expandedThreadReactionMessageIds = signal<Set<string>>(new Set());

  readonly threadReactionLimit = 7;

  // Thread replies belong to channel messages, so reactions
  // are stored as message reactions rather than DM reactions.
  toggleAllThreadReactions(messageId: string): void {
    this.expandedThreadReactionMessageIds.update((current) =>
      this.toggleMessageId(current, messageId)
    );
  }

  private toggleMessageId(current: Set<string>, messageId: string): Set<string> {
    const updated = new Set(current);

    updated.has(messageId)
      ? updated.delete(messageId)
      : updated.add(messageId);
    return updated;
  }

  async toggleThreadReaction(messageId: string, emoji: string): Promise<void> {
    await this.reactionService.addReaction(messageId, emoji, false);
  }

  isThreadReactionExpanded(messageId: string): boolean {
    return this.expandedThreadReactionMessageIds()
      .has(messageId);
  }
  // Keeps thread reactions compact until the user
  // explicitly expands the full reaction list.
  getVisibleThreadReactions(messageId: string): ReactionSummary[] {
    const reactions = this.reactionService.getReactionForMessage(messageId);
    if (this.isThreadReactionExpanded(messageId)) {
      return reactions;
    }
    return reactions.slice(0, this.threadReactionLimit);
  }

  getHiddenThreadReactionCount(messageId: string): number {
    if (this.isThreadReactionExpanded(messageId)) return 0;
    const reactions = this.reactionService.getReactionForMessage(messageId);
    return Math.max( 0, reactions.length - this.threadReactionLimit);
  }

  // Keeps only one thread reaction picker open at a time
  // and closes it when the same message is selected again.
  toggleThreadEmojiPicker(messageId: string, event: Event): void {
    event.stopPropagation();
    this.openedReactionPickerId.update((currentId) =>
      currentId === messageId ? null : messageId
    );
  }

  async addThreadEmojiReaction(event: any, messageId: string): Promise<void> {
    const emoji = event.emoji.native;
    await this.reactionService.addReaction(messageId, emoji, false);
    this.openedReactionPickerId.set(null);
  }

  // Closes temporary thread actions when the user
  // clicks outside the panel or presses Escape
  @HostListener('document:click', ['$event'])
  closeThreadOverlaysOnOutsideClick(event: Event): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) this.closeThreadOverlays();
  }

  @HostListener('document:keydown.escape')
  closeThreadOverlaysOnEscape(): void {
    this.closeThreadOverlays();
  }

  private closeThreadOverlays(): void {
    this.openedReactionPickerId.set(null);
    this.isMessageEdited.set(false);
    this.cancelThreadEdit();
  }

  toggleMessageEdited(): void {
    this.isMessageEdited.update((value) => !value);
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

  // Thread replies share the message update flow because
  // they are stored as regular messages linked to a parent.
  async saveThreadEditedMessage(): Promise<void> {
    const messageId = this.editingThreadMessageId();
    if (!messageId) return;
    await this.messageService.updateMessage(messageId, this.editingThreadText());
    this.cancelThreadEdit();
  }

  // Enter saves the edit, while Shift+Enter preserves
  // multiline editing inside the thread.
  async saveOnEnter(event: KeyboardEvent): Promise<void> {
    if (event.shiftKey) return;
    event.preventDefault();
    await this.saveThreadEditedMessage();
  }

  getReactionUsersNames(userNames: string[]): string {
    if (userNames.length === 1) return userNames[0];
    if (userNames.length === 2) {
      return `${userNames[0]} und ${userNames[1]}`;
    }
    return this.getMultipleReactionNames(userNames);
  }

  private getMultipleReactionNames(userNames: string[]): string {
    const remainingUsers = userNames.length - 2;
    return `${userNames[0]} und ${userNames[1]} und ${remainingUsers} weitere`;
  }

  getReactionVerb(userNames: string[]): string {
    return userNames.length === 1
      ? 'hat reagiert'
      : 'haben reagiert';
  }
}