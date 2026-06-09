import { inject, Injectable, signal } from '@angular/core';
import { MessageView } from "../models/message-view.model";
import { Supabase } from "../supabase/supabase.service";
import { ChannelService } from "./channel.service";
import { Auth } from './auth.service'
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {

  private supabase = inject(Supabase);
  private channelService = inject(ChannelService);
  private authService = inject(Auth);
  private realtimeChannel: any = null;
  private userService = inject(UserService);


  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  messages = signal<MessageView[]>([]);

  async loadMessages(): Promise<void> {
    const channel = this.channelService.currentChannel();
    const currentUserProfile = this.authService.currentUserProfile();

    if (!channel || !currentUserProfile) {
      console.error('Kein Kanal ausgewählt oder kein Benutzerprofil verfügbar');
      return;
    }

    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select('*, profiles(name, avatar)')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Nachrichten:', error);
      return;
    }

    const loadedMessages: MessageView[] = data.map((message) => ({
      id: message.id,
      authorName: message.profiles?.name ?? 'Unbekannter Benutzer',
      avatar: message.profiles?.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      isOwnMessage: message.author_id === currentUserProfile.id,
    }));
    this.messages.set(loadedMessages);

  }

  async sendMessage(text: string): Promise<void> {
    const { data: authUserData } =
      await this.supabase.supabase.auth.getUser();

    const authUser = authUserData.user;

    if (!authUser) {
      console.error('Kein eingeloggter Benutzer');
      return;
    }

    const currentUserProfile = this.authService.currentUserProfile();

    if (!currentUserProfile) {
      console.error('Kein Benutzerprofil verfügbar');
      return;
    }

    const channel = this.channelService.currentChannel();

    if (!channel) {
      console.error('Kein Kanal ausgewählt');
      return;
    }



    const { data, error } = await this.supabase.supabase
      .from('messages')
      .insert({
        channel_id: channel.id,
        author_id: authUser.id,
        text,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      return;
    }


  }

  listenToMessages(): void {
    const channel = this.channelService.currentChannel();

    if (!channel) {
      return;
    }

    if (this.realtimeChannel) {
      this.supabase.supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.supabase.supabase
      .channel(`messages-${channel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const newMessage = payload.new as any;

          const alreadyExists = this.messages().some(
            (message) => message.id === newMessage.id
          );

          if (alreadyExists) {
            return;
          }

          const currentUserProfile = this.authService.currentUserProfile();

          if (!currentUserProfile) {
            return;
          }
          const author = this.userService.user().find((user) => user.id === newMessage.author_id)

          const realtimeMessage: MessageView = {
            id: newMessage.id,
            authorName: author?.name ?? 'Unbekannter Benutzer',
            avatar: author?.avatar || 'assets/img/avatar/avatar-3.png',
            text: newMessage.text,
            time: this.formatTime(newMessage.created_at),
            isOwnMessage: newMessage.author_id === currentUserProfile.id,
          };

          this.messages.update((messages) => [
            ...messages,
            realtimeMessage,
          ]);
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });
  }
}