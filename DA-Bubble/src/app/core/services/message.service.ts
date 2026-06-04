import { inject, Injectable, signal } from '@angular/core';
import { MessageView } from "../models/message-view.model";
import { Supabase } from "../supabase/supabase.service";
import { ChannelService } from "./channel.service";
import { Auth } from './auth.service'

@Injectable({
  providedIn: 'root',
})
export class MessageService {

  private supabase = inject(Supabase);
  private channelService = inject(ChannelService);
  private authService = inject(Auth);

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
      authorName:message.profiles?.name ?? 'Unbekannter Benutzer',
      avatar:message.profiles?.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      isOwnMessage: message.author_id === currentUserProfile.id,
    }));
    this.messages.set(loadedMessages);

  }

  async sendMessage(text: string): Promise<void> {
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
        author_id: currentUserProfile.id,
        text,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      return;
    }

    this.messages.update((messages) => [
      ...messages,
      {
        id: data.id,
        authorName: currentUserProfile.name,
        avatar: currentUserProfile.avatar || 'assets/img/avatar/avatar-3.png',
        text: data.text,
        time: 'Jetzt',
        isOwnMessage: true,
      },
    ]);
  }
}