import { computed, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MessageReaction } from '../models/message-reaction.model';
import { ReactionSummary } from '../models/reaction-summary.model';
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  private supabase = inject(Supabase);
  private authService = inject(Auth);
  private reactionsRealtimeChannel: RealtimeChannel | null = null;

  readonly defaultReactionOptions = ['✅', '👍'];

  reactions = signal<MessageReaction[]>([]);
  lastUsedReactions = signal<string[]>([]);

  reactionOptions = computed<string[]>(() =>
    this.buildReactionOptions()
  );

  reactionSummaries = computed<ReactionSummary[]>(() =>
    this.buildReactionSummaries()
  );

  // Prioritizes recently used reactions while keeping
  // the quick-action list limited to two emojis.
  private buildReactionOptions(): string[] {
    const lastUsed = this.lastUsedReactions();
    if (lastUsed.length === 0) return this.defaultReactionOptions;

    const defaults = this.defaultReactionOptions.filter(
      (emoji) => !lastUsed.includes(emoji)
    );

    return [...lastUsed, ...defaults].slice(0, 2);
  }

  private updateLastUsedReactions(emoji: string): void {
    this.lastUsedReactions.update((current) =>
      [emoji, ...current.filter((item) => item !== emoji)].slice(0, 2)
    );
  }

  // Aggregates individual reaction records into UI summaries
  // grouped by message and emoji.
  private buildReactionSummaries(): ReactionSummary[] {
    const groupedReactions = new Map<string, ReactionSummary>();
    const currentUser = this.authService.currentUserProfile();

    for (const reaction of this.reactions()) {
      this.addReactionToSummary(groupedReactions, reaction, currentUser?.id);
    }
    return Array.from(groupedReactions.values());
  }

  private addReactionToSummary(summaries: Map<string, ReactionSummary>,
    reaction: MessageReaction, currentUserId?: string): void {
    const messageId = this.getReactionMessageId(reaction);
    if (!messageId) return;
    const summary = this.getOrCreateSummary(summaries, messageId, reaction.emoji);
    this.updateSummary(summary, reaction, currentUserId);
  }

  // Reactions can belong to either a channel message
  // or a direct message through separate foreign keys.
  private getReactionMessageId(reaction: MessageReaction): string | null {
    return reaction.message_id ?? reaction.direct_message_id;
  }

  private getOrCreateSummary(summaries: Map<string, ReactionSummary>,
    messageId: string, emoji: string): ReactionSummary {
    const key = `${messageId}_${emoji}`;
    const existingSummary = summaries.get(key);

    if (existingSummary) return existingSummary;

    const summary = this.createReactionSummary(messageId, emoji);
    summaries.set(key, summary);
    return summary;
  }

  private createReactionSummary(messageId: string, emoji: string): ReactionSummary {
    return {
      messageId,
      emoji,
      count: 0,
      reactedByCurrentUser: false,
      userNames: [],
    };
  }

  private updateSummary(summary: ReactionSummary, reaction: MessageReaction,
    currentUserId?: string): void {
    summary.count++;

    if (reaction.profiles?.name) {
      summary.userNames.push(reaction.profiles.name);
    }

    if (reaction.user_id === currentUserId) {
      summary.reactedByCurrentUser = true;
    }
  }

  async loadReactions(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('message_reactions')
      .select('*, profiles(name)')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error', error);
      return;
    }
    this.reactions.set(data);
  }

  private async removeReaction(reactionId: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    const { error } = await this.supabase.supabase
      .from('message_reactions')
      .delete()
      .eq('id', reactionId)
      .eq('user_id', currentUser?.id)

    if (error) {
      console.error('Fehler beim Entfernen der Reaction:', error);
      return;
    }
    this.removeReactionFromState(reactionId);
  }

  private removeReactionFromState(reactionId: string): void {
    this.reactions.update((reactions) =>
      reactions.filter((reaction) => reaction.id !== reactionId)
    );
  }

  // Toggles a reaction: an existing user reaction is removed,
  // otherwise a new reaction is created.
  async addReaction(messageId: string, emoji: string, isDirectMessage: boolean):
    Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    if (!currentUser) return;

    const existingReaction = this.findExistingReaction(
      messageId,
      emoji,
      isDirectMessage,
      currentUser.id
    );

    if (existingReaction) {
      await this.removeReaction(existingReaction.id);
      return;
    }
    await this.insertReaction(messageId, emoji, isDirectMessage, currentUser.id);
  }

  private findExistingReaction(messageId: string, emoji: string,
    isDirectMessage: boolean, userId: string): MessageReaction | undefined {
    return this.reactions().find((reaction) =>
      this.matchesReaction(reaction, messageId, emoji, isDirectMessage, userId));
  }

  private matchesReaction(
    reaction: MessageReaction,
    messageId: string,
    emoji: string,
    isDirectMessage: boolean,
    userId: string
  ): boolean {
    const reactionMessageId = isDirectMessage
      ? reaction.direct_message_id
      : reaction.message_id;

    return reactionMessageId === messageId &&
      reaction.user_id === userId &&
      reaction.emoji === emoji;
  }

  private async insertReaction(messageId: string, emoji: string,
    isDirectMessage: boolean, userId: string): Promise<void> {
    const reactionData = this.buildReactionData(messageId, emoji,
      isDirectMessage, userId);

    const { error } = await this.supabase.supabase
      .from('message_reactions')
      .insert(reactionData);

    if (error) {
      console.error('Fehler beim Hinzufügen der Reaction:', error);
      return;
    }
    await this.finishReactionInsert(emoji);
  }

  // Sets exactly one message reference depending on whether
  // the reaction belongs to a channel message or a DM.
  private buildReactionData(messageId: string, emoji: string, 
    isDirectMessage: boolean,userId: string) {
    return {
      message_id: isDirectMessage ? null : messageId,
      direct_message_id: isDirectMessage ? messageId : null,
      user_id: userId,
      emoji,
    };
  }

  private async finishReactionInsert(emoji: string): Promise<void> {
    this.updateLastUsedReactions(emoji);
    await this.loadReactions();
  }

  getReactionForMessage(messageId: string): ReactionSummary[] {
    return this.reactionSummaries().filter(
      (reaction) => reaction.messageId === messageId
    );
  }

  getLimitedReactionsForMessage(messageId: string, limit: number): ReactionSummary[] {
    return this.getReactionForMessage(messageId).slice(0, limit);
  }

  // Reloads reaction state for every reaction change so counts,
  // users and current-user flags remain synchronized.
  subscribeToReactions(): void {
    this.removeReactionsRealtimeChannel();
    this.reactionsRealtimeChannel = this.createReactionsRealtimeChannel();
  }

  private createReactionsRealtimeChannel(): RealtimeChannel {
    return this.supabase.supabase
      .channel('message-reactions-realtime')
      .on('postgres_changes', this.getReactionsRealtimeConfig(),
        () => this.loadReactions())
      .subscribe();
  }

  private getReactionsRealtimeConfig() {
    return {
      event: '*' as const,
      schema: 'public',
      table: 'message_reactions',
    };
  }

  removeReactionsRealtimeChannel(): void {
    if (!this.reactionsRealtimeChannel) return;

    this.supabase.supabase.removeChannel(
      this.reactionsRealtimeChannel
    );
    this.reactionsRealtimeChannel = null;
  }
}