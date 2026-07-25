import { computed, inject, Injectable, signal } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';
import { MessageReaction } from '../models/message-reaction.model';
import { ReactionSummary } from '../models/reaction-summary.model';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  private supabase = inject(Supabase);
  private authService = inject(Auth);
  readonly defaultReactionOptions = ['✅', '👍'];
  reactions = signal<MessageReaction[]>([]);
  lastUsedReactions = signal<string[]>([]);
  private reactionsRealtimeChannel: RealtimeChannel | null = null;

  reactionOptions = computed<string[]>(()=> {
    const lastUsed = this.lastUsedReactions();

    if(lastUsed.length === 0 ){
      return this.defaultReactionOptions;
    }

    return [
      ...lastUsed,
      ...this.defaultReactionOptions.filter(
        (emoji)=> !lastUsed.includes(emoji)
      )
    ].slice(0,2)
  })

  private updateLastUsedReactions(emoji:string):void{
    this.lastUsedReactions.update((current)=>{
      return[
        emoji, 
        ...current.filter((item)=> item !== emoji)
      ].slice(0,2)
    })
  }

reactionSummaries = computed<ReactionSummary[]>(() => {
  const currentUser = this.authService.currentUserProfile();
  const groupedReactions = new Map<string, ReactionSummary>();

  for (const reaction of this.reactions()) {
    const reactionMessageId =
      reaction.message_id ?? reaction.direct_message_id;

    if (!reactionMessageId) {
      continue;
    }

    const key = `${reactionMessageId}_${reaction.emoji}`;

    if (!groupedReactions.has(key)) {
      groupedReactions.set(key, {
        messageId: reactionMessageId,
        emoji: reaction.emoji,
        count: 0,
        reactedByCurrentUser: false,
        userNames: [],
      });
    }

    const summary = groupedReactions.get(key)!;

    summary.count++;

    if (reaction.profiles?.name) {
      summary.userNames.push(reaction.profiles.name);
    }

    if (reaction.user_id === currentUser?.id) {
      summary.reactedByCurrentUser = true;
    }
  }

  return Array.from(groupedReactions.values());
});


  async loadReactions(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('message_reactions')
      .select('*, profiles(name)')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Error', error);
      return;
    }
    this.reactions.set(data)
  }

  private async removeReaction(reactionId: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    const { data, error } = await this.supabase.supabase
      .from('message_reactions')
      .delete()
      .eq('id', reactionId)
      .eq('user_id', currentUser?.id)
      .select();

    if (error) {
      console.error('Fehler beim Entfernen der Reaction:', error);
      return;
    }

    this.reactions.update((reactions) =>
      reactions.filter((reaction) => reaction.id !== reactionId)
    )
  }

async addReaction(
  messageId: string,
  emoji: string,
  isDirectMessage: boolean
): Promise<void> {
  const currentUser = this.authService.currentUserProfile();

  if (!currentUser) {
    return;
  }

  const existingReaction = this.reactions().find((reaction) => {
    const reactionMessageId = isDirectMessage
      ? reaction.direct_message_id
      : reaction.message_id;

    return (
      reactionMessageId === messageId &&
      reaction.user_id === currentUser.id &&
      reaction.emoji === emoji
    );
  });

  if (existingReaction) {
    await this.removeReaction(existingReaction.id);
    return;
  }

  const reactionData: {
    message_id: string | null;
    direct_message_id: string | null;
    user_id: string;
    emoji: string;
  } = isDirectMessage
    ? {
        message_id: null,
        direct_message_id: messageId,
        user_id: currentUser.id,
        emoji,
      }
    : {
        message_id: messageId,
        direct_message_id: null,
        user_id: currentUser.id,
        emoji,
      };

  const { error } = await this.supabase.supabase
    .from('message_reactions')
    .insert(reactionData);

  if (error) {
    console.error('Fehler beim Hinzufügen der Reaction:', error);
    return;
  }

  this.updateLastUsedReactions(emoji);
  await this.loadReactions();
}


  getReactionForMessage(messageId: string): ReactionSummary[] {
    return this.reactionSummaries().filter(
      (reaction) => reaction.messageId === messageId
    )
  }

subscribeToReactions(): void {
  this.removeReactionsRealtimeChannel();
  this.reactionsRealtimeChannel = this.supabase.supabase
    .channel('message-reactions-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      },
      async () => {
        await this.loadReactions();
      }
    )
    .subscribe();
}

removeReactionsRealtimeChannel(): void {
  if (!this.reactionsRealtimeChannel) {
    return;
  }

  this.supabase.supabase.removeChannel(
    this.reactionsRealtimeChannel
  );

  this.reactionsRealtimeChannel = null;
}

}
