import { inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Profile } from '../models/profile.model';
import { MessageView } from '../models/message-view.model';
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DirectMessageService {
  currentDmUser = signal<Profile | null>(null);
  directMessages = signal<MessageView[]>([]);
  supabase = inject(Supabase);
  authService = inject(Auth);

  private dmRealtimeChannel: RealtimeChannel | null = null;

  async loadDirectMessages(): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();

    if (!currentUser || !selectedUser) {
      console.error('Kein Benutzer oder DM-Partner ausgewählt');
      return;
    }

    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Direktnachrichten:', error);
      return;
    }

    const loadedMessages = data.map((message) =>
      this.mapDirectMessage(message, currentUser, selectedUser)
    );

    this.directMessages.set(loadedMessages);
  }

  async sendDirectMessage(text: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();
    const authUser = this.authService.currentUser();

    if (!authUser || !currentUser || !selectedUser) {
      console.error('Kein Benutzer oder DM-Partner ausgewählt');
      return;
    }

    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .insert({
        sender_id: authUser.id,
        receiver_id: selectedUser.id,
        text,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Senden der Direktnachricht:', error);
      return;
    }

    const newMessage = this.mapDirectMessage(data, currentUser, selectedUser);

    this.directMessages.update((messages) => {
      const alreadyExists = messages.some((message) => message.id === newMessage.id);

      if (alreadyExists) {
        return messages;
      }

      return [...messages, newMessage];
    });
  }

  listenToDirectMessages(): void {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();

    if (!currentUser || !selectedUser) {
      return;
    }

    this.removeDmRealtimeChannel();

    this.dmRealtimeChannel = this.supabase.supabase
      .channel(`direct-messages-${currentUser.id}-${selectedUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMessage = payload.new as any;

          if (!this.belongsToCurrentConversation(newMessage)) {
            return;
          }

          this.directMessages.update((messages) => {
            const alreadyExists = messages.some(
              (message) => message.id === newMessage.id
            );

            if (alreadyExists) {
              return messages;
            }

            return [
              ...messages,
              this.mapDirectMessage(newMessage, currentUser, selectedUser),
            ];
          });
        }
      )
      .subscribe((status) => {
        console.log('DM realtime status:', status);
      });
  }

  removeDmRealtimeChannel(): void {
    if (this.dmRealtimeChannel) {
      this.supabase.supabase.removeChannel(this.dmRealtimeChannel);
      this.dmRealtimeChannel = null;
    }
  }

  private belongsToCurrentConversation(message: any): boolean {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();

    if (!currentUser || !selectedUser) {
      return false;
    }

    return (
      (message.sender_id === currentUser.id &&
        message.receiver_id === selectedUser.id) ||
      (message.sender_id === selectedUser.id &&
        message.receiver_id === currentUser.id)
    );
  }

  private mapDirectMessage(
    message: any,
    currentUser: Profile,
    selectedUser: Profile
  ): MessageView {
    return {
      id: message.id,
      authorName:
        message.sender_id === currentUser.id
          ? currentUser.name
          : selectedUser.name,
      avatar:
        message.sender_id === currentUser.id
          ? currentUser.avatar || 'assets/img/avatar/avatar-3.png'
          : selectedUser.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      isOwnMessage: message.sender_id === currentUser.id,
    };
  }

  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async selectDmUSer(user:Profile):Promise<void>{
    this.currentDmUser.set(user);
    await this.loadDirectMessages();
    this.listenToDirectMessages();
  }
}