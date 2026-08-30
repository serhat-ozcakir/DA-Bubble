import { inject, Injectable, signal } from '@angular/core';
import { MessageView } from '../models/message-view.model';
import { Supabase } from '../supabase/supabase.service';
import { ChannelService } from './channel.service';
import { Auth } from './auth.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private supabase = inject(Supabase);
  private channelService = inject(ChannelService);
  private authService = inject(Auth);
  private userService = inject(UserService);
  private realtimeChannel: any = null;
  private threadRealtimeChannel: any = null;

  messages = signal<MessageView[]>([]);
  selectedThreadMessage = signal<MessageView | null>(null);
  threadMessages = signal<MessageView[]>([]);

  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async loadMessages(): Promise<void> {
    const channel = this.channelService.currentChannel();
    const profile = this.authService.currentUserProfile();

    if (!channel || !profile) {
      console.error('Kein Kanal ausgewählt oder kein Benutzerprofil verfügbar');
      return;
    }

    const data = await this.fetchMessages(channel.id);
    if (!data) return;
    this.messages.set(this.buildMessageViews(data, profile.id));
  }

  private async fetchMessages(channelId: string): Promise<any[] | null> {
    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select('id, author_id,text,created_at,parent_message_id, profiles(name, avatar)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (!error) return data;
    console.error('Fehler beim Laden der Nachrichten:', error);
    return null;
  }

  // Separates top-level messages from replies and derives
  // thread metadata before building the message view models.
  private buildMessageViews(data: any[], profileId: string): MessageView[] {
    const mainMessages = data.filter(
      (message) => !message.parent_message_id);
    const repliesByParent = this.groupRepliesByParent(data);
    return mainMessages.map((message) =>
      this.mapMainMessage(message, repliesByParent, profileId));
  }

  // Groups replies once by parent ID to avoid repeatedly
  // scanning all messages when calculating thread metadata.
  private groupRepliesByParent(data: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    for (const message of data) {
      this.addReplyToGroup(grouped, message);
    }
    return grouped;
  }

  private addReplyToGroup(grouped: Map<string, any[]>, message: any): void {
    const parentId = message.parent_message_id;
    if (!parentId) return;
    const replies = grouped.get(parentId) ?? [];
    replies.push(message);
    grouped.set(parentId, replies);
  }

  private mapMainMessage(message: any, repliesByParent: Map<string, any[]>,
    profileId: string): MessageView {
    const replies = repliesByParent.get(message.id) ?? [];
    const lastReply = replies.at(-1) ?? null;
    return this.createMessageView(message, profileId, replies.length, lastReply);
  }

  private createMessageView(message: any, profileId: string,
    threadCount = 0, lastReply: any = null): MessageView {
    return {
      id: message.id,
      authorName: message.profiles?.name ?? 'Unbekannter Benutzer',
      avatar: message.profiles?.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      createdAt: message.created_at,
      isOwnMessage: message.author_id === profileId,
      threadCount,
      lastThreadReplyTime: lastReply
        ? this.formatTime(lastReply.created_at)
        : null,
    };
  }

  private incrementThreadCount(parentMessageId: string): void {
    this.messages.update((messages) =>
      messages.map((message) =>
        this.incrementMatchingThread(message, parentMessageId)
      )
    );
    this.incrementSelectedThread(parentMessageId);
  }

  private incrementMatchingThread(message: MessageView, parentId: string): MessageView {
    if (message.id !== parentId) return message;

    return {
      ...message,
      threadCount: (message.threadCount || 0) + 1,
    };
  }

  private incrementSelectedThread(parentMessageId: string): void {
    const selectedMessage = this.selectedThreadMessage();
    if (selectedMessage?.id !== parentMessageId) return;

    this.selectedThreadMessage.set({
      ...selectedMessage,
      threadCount: (selectedMessage.threadCount || 0) + 1,
    });
  }

  async sendMessage(text: string): Promise<void> {
    const authUser = await this.getAuthUser();
    if (!authUser) return;

    const profile = this.authService.currentUserProfile();
    if (!profile) {
      console.error('Kein Benutzerprofil verfügbar');
      return;
    }

    const channel = this.channelService.currentChannel();
    if (!channel) {
      console.error('Kein Kanal ausgewählt');
      return;
    }
    await this.insertMessage(channel.id, authUser.id, text);
  }

  private async getAuthUser() {
    const { data } = await this.supabase.supabase.auth.getUser();

    if (!data.user) {
      console.error('Kein eingeloggter Benutzer');
      return null;
    }
    return data.user;
  }

  private async insertMessage(channelId: string, authorId: string, text: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('messages')
      .insert({ channel_id: channelId, author_id: authorId, text })

    if (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }

  // Replaces the previous message listener whenever
  // the active channel changes.
  listenToMessages(): void {
    const channel = this.channelService.currentChannel();
    if (!channel) return;
    this.removeMessageRealtimeChannel();
    this.realtimeChannel = this.createMessageRealtimeChannel(channel.id);
  }

  private removeMessageRealtimeChannel(): void {
    if (!this.realtimeChannel) return;
    this.supabase.supabase.removeChannel(this.realtimeChannel);
  }

  private createMessageRealtimeChannel(channelId: string) {
    return this.supabase.supabase
      .channel(`messages-${channelId}`)
      .on('postgres_changes', this.getMessageRealtimeConfig(channelId),
        (payload) => this.handleMessageRealtimePayload(payload)
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });
  }

  // Listen to the active channel for both new messages
  // and edits while ignoring unrelated channel traffic.
  private getMessageRealtimeConfig(channelId: string) {
    return {
      event: '*' as const,
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`,
    };
  }

  // Thread replies update their parent metadata instead of
  // being rendered as top-level channel messages.
  private handleRealtimeMessage(newMessage: any): void {
    if (newMessage.parent_message_id) {
      this.updateThreadInfo(newMessage);
      return;
    }

    // The sender can receive its own insert through realtime,
    // so ignore messages that are already present locally.
    if (this.messageAlreadyExists(newMessage.id)) return;
    const profile = this.authService.currentUserProfile();
    if (!profile) return;
    this.addRealtimeMessage(newMessage, profile.id);
  }

  private updateThreadInfo(newMessage: any): void {
    const parentId = newMessage.parent_message_id;
    const replyTime = this.formatTime(newMessage.created_at);
    this.incrementThreadCount(parentId);
    this.updateLastThreadReplyTime(parentId, replyTime);
  }

  private updateLastThreadReplyTime(parentId: string, replyTime: string): void {
    this.messages.update((messages) =>
      messages.map((message) =>
        this.setLastReplyTime(message, parentId, replyTime))
    );
    this.updateSelectedThreadReplyTime(parentId, replyTime);
  }

  private setLastReplyTime(message: MessageView, parentId: string, replyTime: string)
    : MessageView {
    if (message.id !== parentId) return message;
    return {
      ...message,
      lastThreadReplyTime: replyTime,
    };
  }

  private updateSelectedThreadReplyTime(parentId: string, replyTime: string): void {
    const selectedMessage = this.selectedThreadMessage();
    if (selectedMessage?.id !== parentId) return;

    this.selectedThreadMessage.set({
      ...selectedMessage,
      lastThreadReplyTime: replyTime,
    });
  }

  private handleMessageRealtimePayload(payload: any): void {
    if (payload.eventType === 'INSERT') {
      this.handleRealtimeMessage(payload.new);
      return;
    }

    if (payload.eventType === 'UPDATE') {
      this.handleRealtimeUpdate(payload.new);
    }
  }

  private handleRealtimeUpdate(message: any): void {
    if (!message?.id) return;
    this.updateMessageStates(message.id, message.text);
  }

  private messageAlreadyExists(messageId: string): boolean {
    return this.messages().some((message) => message.id === messageId);
  }

  private addRealtimeMessage(newMessage: any, profileId: string): void {
    const author = this.userService.user().find((user) => user.id === newMessage.author_id);
    const message = this.createRealtimeMessage(newMessage, profileId, author);
    this.messages.update((messages) => [...messages, message]);
  }

  private createRealtimeMessage(message: any, profileId: string, author: any
  ): MessageView {
    return {
      id: message.id,
      authorName: author?.name ?? 'Unbekannter Benutzer',
      avatar: author?.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      createdAt: message.created_at,
      isOwnMessage: message.author_id === profileId,
      threadCount: 0,
    };
  }

  // Loads existing replies before subscribing to new ones
  // for the currently selected thread.
  async openThread(message: MessageView): Promise<void> {
    console.log('Thread geöffnet:', message);
    this.selectedThreadMessage.set(message);
    await this.loadThreadMessages(message.id);
    this.listenToThreadMessage(message.id);
  }

  async loadThreadMessages(parentMessageId: string): Promise<void> {
    const profile = this.authService.currentUserProfile();
    if (!profile) return;

    const data = await this.fetchThreadMessages(parentMessageId);
    if (!data) return;

    this.threadMessages.set(
      data.map((message) => this.mapThreadMessage(message, profile.id))
    );
  }

  private async fetchThreadMessages(parentMessageId: string): Promise<any[] | null> {
    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select('id, author_id, text, created_at, profiles(name,avatar)')
      .eq('parent_message_id', parentMessageId)
      .order('created_at', { ascending: true });

    if (!error) return data;
    console.log('Fehler beim Laden der Thread-Nachrichten:', error);
    return null;
  }

  private mapThreadMessage(message: any, profileId: string): MessageView {
    return {
      id: message.id,
      authorName: message.profiles?.name || 'Unbekannter Benutzer',
      avatar: message.profiles?.avatar || 'assets/img/avatar/avatar-3.png',
      text: message.text,
      time: this.formatTime(message.created_at),
      createdAt: message.created_at,
      isOwnMessage: message.author_id === profileId,
    };
  }

  // Thread replies share the messages table and are linked
  // to their parent through parent_message_id.
  async sendThreadMessage(text: string): Promise<void> {
    const message = this.selectedThreadMessage();
    const profile = this.authService.currentUserProfile();
    const channel = this.channelService.currentChannel();

    if (!message || !profile || !channel) {
      console.error('Thread, Benutzer oder Channel fehlt');
      return;
    }
    await this.insertThreadMessage(channel.id, profile.id, message.id, text);
    await this.loadThreadMessages(message.id);
  }

  private async insertThreadMessage(channelId: string, authorId: string,
    parentId: string, text: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('messages')
      .insert({
        channel_id: channelId, author_id: authorId, text,
        parent_message_id: parentId})

    if (error) {
      console.error('Fehler beim Senden der Thread-Nachricht:', error);
    }
  }

  closeThread(): void {
    this.selectedThreadMessage.set(null);
    this.threadMessages.set([]);
  }

  listenToThreadMessage(parentMessageId: string): void {
    this.removeThreadRealtimeChannel();
    this.threadRealtimeChannel =
      this.createThreadRealtimeChannel(parentMessageId);
  }

  private removeThreadRealtimeChannel(): void {
    if (!this.threadRealtimeChannel) return;
    this.supabase.supabase.removeChannel(this.threadRealtimeChannel);
  }

  private createThreadRealtimeChannel(parentMessageId: string) {
    return this.supabase.supabase
      .channel(`thread-messages-${parentMessageId}`)
      .on('postgres_changes', this.getThreadRealtimeConfig(parentMessageId),
        (payload) => this.handleRealtimeThreadMessage(payload.new)
      )
      .subscribe((status) => {
        console.log('Thread realtime status:', status);
      });
  }

  private handleRealtimeThreadMessage(newMessage: any): void {

    // The sender also reloads the thread after inserting a reply,
    // so ignore the same message if realtime delivers it again.
    if (this.threadMessageAlreadyExists(newMessage.id)) return;

    const profile = this.authService.currentUserProfile();
    if (!profile) return;

    const message = this.buildRealtimeThreadMessage(newMessage, profile.id);
    this.threadMessages.update((messages) => [...messages, message]);
  }

  private threadMessageAlreadyExists(messageId: string): boolean {
    return this.threadMessages().some((message) => message.id === messageId);
  }

  private buildRealtimeThreadMessage(newMessage: any, profileId: string): MessageView {
    const author = this.userService.user().find((user) => user.id === newMessage.author_id);
    return this.createRealtimeMessage(newMessage, profileId, author);
  }

  private getThreadRealtimeConfig(parentMessageId: string) {
    return {
      event: 'INSERT' as const,
      schema: 'public',
      table: 'messages',
      filter: `parent_message_id=eq.${parentMessageId}`,
    };
  }

  async updateMessage(messageId: string, newText: string): Promise<void> {
    const text = newText.trim();
    if (!text) return;

    const updated = await this.updateMessageRecord(messageId, text);
    if (!updated) return;
    this.updateMessageStates(messageId, text);
  }

  private async updateMessageRecord(messageId: string, text: string): Promise<boolean> {
    const { error } = await this.supabase.supabase
      .from('messages')
      .update({ text })
      .eq('id', messageId)

    if (!error) return true;
    console.log('error:', error);
    return false;
  }

  // Keeps every representation of a message synchronized
  // after either a local edit or a realtime update.
  private updateMessageStates(messageId: string, text: string): void {
    this.messages.update((messages) =>
      this.replaceMessageText(messages, messageId, text)
    );
    this.threadMessages.update((messages) =>
      this.replaceMessageText(messages, messageId, text));
    this.updateSelectedThreadText(messageId, text);
  }

  private replaceMessageText(messages: MessageView[], messageId: string, text: string): MessageView[] {
    return messages.map((message) =>
      message.id === messageId ? { ...message, text } : message
    );
  }

  private updateSelectedThreadText(messageId: string, text: string): void {
    const selectedMessage = this.selectedThreadMessage();
    if (selectedMessage?.id !== messageId) return;

    this.selectedThreadMessage.set({
      ...selectedMessage,
      text,
    });
  }
}