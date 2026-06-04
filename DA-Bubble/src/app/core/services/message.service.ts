import { inject, Injectable, signal } from '@angular/core';
import { MessageView } from "../models/message-view.model";
import { Supabase } from "../supabase/supabase.service";

@Injectable({
  providedIn: 'root',
})
export class MessageService {

  private channelId = '838e45a7-d261-406b-b9e8-616226ab43bc';
  private authorId = 'ece84594-4c34-4308-a13b-fd3898ed66e1';
  private supabase = inject(Supabase);


  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  messages = signal<MessageView[]>([]);

  async loadMessages(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select('*')
      .eq('channel_id', this.channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Nachrichten:', error);
      return;
    }
    const loadedMessages: MessageView[] = data.map((message) => ({
      id: message.id,
      authorName: message.author_id === this.authorId ? 'Serhat Özcakir' : 'Unbekannter Autor',
      avatar: message.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      isOwnMessage: message.author_id === this.authorId,
    }));
    this.messages.set(loadedMessages);

  }
  

  async sendMessage(text: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('messages')
      .insert({
        channel_id: this.channelId,
        author_id: this.authorId,
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
        authorName: 'Serhat Özçakır',
        avatar: 'assets/img/avatar/avatar-3.png',
        text: data.text,
        time: 'Jetzt',
        isOwnMessage: true,
      },
    ]);
  }
}