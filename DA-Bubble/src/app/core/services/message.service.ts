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
  private threadRealtimeChannel: any = null;
  private userService = inject(UserService);
  selectedThreadMessage = signal<MessageView | null>(null)
  threadMessages = signal<MessageView[]>([])


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

    const mainMessages = data.filter((message) => !message.parent_message_id)
    const replies = data.filter((message) => message.parent_message_id)

    const loadedMessages: MessageView[] = mainMessages.map((message) => {
      const threadCount = replies.filter(
        (reply) => reply.parent_message_id === message.id
      ).length;

return {
  id: message.id,
  authorName: message.profiles?.name ?? 'Unbekannter Benutzer',
  avatar: message.profiles?.avatar || 'assets/img/avatar/avatar-3.png',
  text: message.text,
  time: this.formatTime(message.created_at),
  createdAt: message.created_at,
  isOwnMessage: message.author_id === currentUserProfile.id,
  threadCount,
};
    });
    this.messages.set(loadedMessages);

  }

  private incrementThreadCount(parentMessageId: string): void {
    this.messages.update((messages) =>
      messages.map((message) =>
        message.id === parentMessageId ? {
          ...message,
          threadCount: (message.threadCount || 0) + 1,
        } : message
      )
    );
    const selectedMessage = this.selectedThreadMessage();

    if (selectedMessage?.id === parentMessageId) {
      this.selectedThreadMessage.set({
        ...selectedMessage,
        threadCount: (selectedMessage.threadCount || 0) + 1,
      });
    }
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

          if (newMessage.parent_message_id) {
            this.messages.update((messages) =>
              messages.map((message) =>
                message.id === newMessage.parent_message_id
                  ? {
                    ...message,
                    threadCount: (message.threadCount || 0) + 1,
                  }
                  : message
              )
            );

            return;
          }

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

          const author = this.userService
            .user()
            .find((user) => user.id === newMessage.author_id);

const realtimeMessage: MessageView = {
  id: newMessage.id,
  authorName: author?.name ?? 'Unbekannter Benutzer',
  avatar:
    author?.avatar || 'assets/img/avatar/avatar-3.png',
  text: newMessage.text,
  time: this.formatTime(newMessage.created_at),
  createdAt: newMessage.created_at,
  isOwnMessage:
    newMessage.author_id === currentUserProfile.id,
  threadCount: 0,
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

  async openThread(message: MessageView): Promise<void> {
    console.log('Thread geöffnet:', message);
    this.selectedThreadMessage.set(message);
    await this.loadThreadMessages(message.id)
    this.listenToThreadMessage(message.id)
  }

  async loadThreadMessages(parentMessageId: string): Promise<void> {

    const currentUserProfile = this.authService.currentUserProfile()

    if (!currentUserProfile) {
      return;
    }

    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select('*, profiles(name,avatar)')
      .eq('parent_message_id', parentMessageId)
      .order('created_at', { ascending: true })

    if (error) {
      console.log('Fehler beim Laden der Thread-Nachrichten:', error);
      return;
    }

const loadedThreadMessages: MessageView[] = data.map((message) => ({
  id: message.id,
  authorName: message.profiles?.name || 'Unbekannter Benutzer',
  avatar: message.profiles?.avatar || 'assets/img/avatar/avatar-3.png',
  text: message.text,
  time: this.formatTime(message.created_at),
  createdAt: message.created_at,
  isOwnMessage: message.author_id === currentUserProfile.id,
}));

    this.threadMessages.set(loadedThreadMessages)
  }

  async sendThreadMessage(text: string): Promise<void> {
    const selectedMessage = this.selectedThreadMessage();
    const currentUserProfile = this.authService.currentUserProfile();
    const channel = this.channelService.currentChannel();

    if (!selectedMessage || !currentUserProfile || !channel) {
      console.error('Thread, Benutzer oder Channel fehlt');
      return;
    }

    const { data, error } = await this.supabase.supabase
      .from('messages')
      .insert({
        channel_id: channel.id,
        author_id: currentUserProfile.id,
        text,
        parent_message_id: selectedMessage.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Senden der Thread-Nachricht:', error);
    }
    await this.loadThreadMessages(selectedMessage.id);
  }

  closeThread(): void {
    this.selectedThreadMessage.set(null);
    this.threadMessages.set([])
  }

  listenToThreadMessage(parentMessageId: string): void {
    if (this.threadRealtimeChannel) {
      this.supabase.supabase.removeChannel(this.threadRealtimeChannel)
    }

    this.threadRealtimeChannel = this.supabase.supabase
      .channel(`thread-messages-${parentMessageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `parent_message_id=eq.${parentMessageId}`,
        },
        (payload) => {
          console.log('Realtime thread reply:', payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Thread realtime status:', status);
      });
  }

  async updateMessage(messageId: string, newText: string): Promise<void> {
    const text = newText.trim();

    if (!text) return

    const {data, error } = await this.supabase.supabase
      .from('messages')
      .update({
        text: text,
      })
      .eq('id', messageId)
      .select('*');

    if (error) {
      console.log('error:', error);
    }
    this.messages.update((messages) =>
      messages.map((message) =>
        message.id === messageId ?
          { ...message, text: text } : message)
    )
    this.threadMessages.update((messages)=>
    messages.map((message)=>
    message.id === messageId ?
    {...message, text} : message
  ))
  }

}