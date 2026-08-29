import {Component, ElementRef, HostListener, inject, input, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MessageView } from '../../../../core/models/message-view.model';
import { ReactionSummary } from '../../../../core/models/reaction-summary.model';
import { MessageService } from '../../../../core/services/message.service';
import { ReactionService } from '../../../../core/services/reaction.service';
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
  private elementRef = inject(ElementRef);
  directMessageService = inject(DirectMessageService);
  reactionService = inject(ReactionService);
  isShowEmojiPicker = signal(false);
  isMessageEdited = signal(false);
  editingMessageID = signal<string | null>(null);
  editingText = signal('');
  isMobile = signal(window.innerWidth <= 1024);
  expandedReactionMessageIds = signal<Set<string>>(new Set());

  readonly desktopReactionLimit = 20;
  readonly mobileReactionLimit = 7;

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
    if (this.isReactionExpanded(messageId)) {
      return this.reactionService.getReactionForMessage(messageId);
    }

    return this.reactionService.getLimitedReactionsForMessage(
      messageId,
      this.getReactionLimit()
    );
  }

  getTotalReactionCount(messageId: string): number {
    return this.reactionService
      .getReactionForMessage(messageId)
      .length;
  }

  getHiddenReactionCount(messageId: string): number {
    if (this.isReactionExpanded(messageId)) return 0;

    const hiddenCount =
      this.getTotalReactionCount(messageId) -
      this.getReactionLimit();

    return Math.max(0, hiddenCount);
  }

  toggleAllReactions(messageId: string): void {
    this.expandedReactionMessageIds.update((current) =>
      this.toggleReactionId(current, messageId)
    );
  }

  private toggleReactionId(current: Set<string>,messageId: string): Set<string> {
    const updated = new Set(current);

    updated.has(messageId)
      ? updated.delete(messageId)
      : updated.add(messageId);

    return updated;
  }

  isReactionExpanded(messageId: string): boolean {
    return this.expandedReactionMessageIds().has(messageId);
  }

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event: Event): void {
    const clickedInside =
      this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.closeMessageActions();
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape(): void {
    this.closeMessageActions();
    this.cancelEditMessage();
  }

  private closeMessageActions(): void {
    this.isShowEmojiPicker.set(false);
    this.isMessageEdited.set(false);
  }

  openThread(): void {
    if (this.isDirectMessage()) return;
    this.messageService.openThread(this.message());
  }

  private isDirectMessage(): boolean {
    return this.directMessageService.currentDmUser() !== null;
  }

  toggleEmojiPicker(): void {
    this.isShowEmojiPicker.update((value) => !value);
  }

  async addEmojiReaction(event: any): Promise<void> {
    const emoji = event.emoji.native;

    await this.reactionService.addReaction(
      this.message().id,
      emoji,
      this.isDirectMessage()
    );

    this.isShowEmojiPicker.set(false);
  }

  toggleMessageEdited(event: Event): void {
    event.stopPropagation();
    this.isMessageEdited.update((value) => !value);
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

    if (!this.shouldSaveEdit(newText, currentMessage)) {
      this.cancelEditMessage();
      return;
    }

    await this.updateCurrentMessage(currentMessage.id, newText);
    this.cancelEditMessage();
  }

  private shouldSaveEdit(
    newText: string,
    message: MessageView
  ): boolean {
    return !!newText && newText !== message.text;
  }

  private async updateCurrentMessage(messageId: string, text: string): Promise<void> {
    if (this.isDirectMessage()) {
      await this.directMessageService.updateDirectMessage(
        messageId,
        text
      );
      return;
    }

    await this.messageService.updateMessage(messageId, text);
  }

  async saveOnEnter(event: KeyboardEvent): Promise<void> {
    if (event.shiftKey) return;

    event.preventDefault();
    await this.saveEditedMessage();
  }

  getReactionUsersNames(userNames: string[]): string {
    if (userNames.length === 1) return userNames[0];
    if (userNames.length === 2) {
      return `${userNames[0]} und ${userNames[1]}`;
    }

    return this.getMultipleReactionNames(userNames);
  }

  private getMultipleReactionNames(userNames: string[]): string {
    const additionalUsers = userNames.length - 2;

    return `${userNames[0]} und ${userNames[1]} und ` +
      `${additionalUsers} weitere`;
  }

  getReactionVerb(userNames: string[]): string {
    return userNames.length === 1
      ? 'hat reagiert'
      : 'haben reagiert';
  }

  async toggleQuickReaction(emoji: string): Promise<void> {
    await this.reactionService.addReaction(
      this.message().id,
      emoji,
      this.isDirectMessage()
    );
  }
}