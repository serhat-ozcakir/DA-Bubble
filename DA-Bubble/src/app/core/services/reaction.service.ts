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
}
