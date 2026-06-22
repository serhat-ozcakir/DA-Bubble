import { computed, inject, Injectable, signal } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';
import { MessageReaction } from '../models/message-reaction.model';
import { ReactionSummary } from '../models/reaction-summary.model'

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  private supabase = inject(Supabase);
  private authService = inject(Auth);
  readonly reactionOptions = ['✅', '👍', '🚀'];
  reactions = signal<MessageReaction[]>([]);

  reactionSummaries = computed<ReactionSummary[]>(() => {
    const currentUser = this.authService.currentUserProfile();
    const groupedReactions = new Map<string, ReactionSummary>();

    for (const reaction of this.reactions()) {
      const key = `${reaction.message_id}_${reaction.emoji}`;

      if (!groupedReactions.has(key)) {
        groupedReactions.set(key, {
          messageId: reaction.message_id,
          emoji: reaction.emoji,
          count: 0,
          reactedByCurrentUser: false
        })
      }
      const summary = groupedReactions.get(key)!;
      summary.count++;

      if (reaction.user_id === currentUser?.id) {
        summary.reactedByCurrentUser = true;
      }

    }
    return Array.from(groupedReactions.values());
  })


  async loadReactions(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('message_reactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Error', error);
      return;
    }
    this.reactions.set(data)
  }

  private async removeReaction(reactionId: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    console.log('Deleting reaction id:', reactionId);
    console.log('Current user id:', currentUser?.id);

    const { data, error } = await this.supabase.supabase
      .from('message_reactions')
      .delete()
      .eq('id', reactionId)
      .eq('user_id', currentUser?.id)
      .select();

    console.log('Delete result:', data);
    console.log('Delete error:', error);

    if (error) {
      console.error('Fehler beim Entfernen der Reaction:', error);
      return;
    }

    this.reactions.update((reactions) =>
      reactions.filter((reaction) => reaction.id !== reactionId)
    )
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    if (!currentUser) return;

    const existingReaction = this.reactions().find(
      (reaction) =>
        reaction.message_id === messageId &&
        reaction.user_id === currentUser.id &&
        reaction.emoji === emoji
    )

    if (existingReaction) {
      await this.removeReaction(existingReaction.id);
      return;
    }

    const { error } = await this.supabase.supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: currentUser.id,
        emoji: emoji,
      })
    if (error) {
      console.log('error', error);
      return;
    }
    await this.loadReactions();
  }


  getReactionForMessage(messageId: string): ReactionSummary[] {
    return this.reactionSummaries().filter(
      (reaction) => reaction.messageId === messageId
    )
  }

}
