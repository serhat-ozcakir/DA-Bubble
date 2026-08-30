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

    const data = await this.fetchDirectMessages(currentUser, selectedUser);
    if (!data) return;
    this.setDirectMessages(data, currentUser, selectedUser);
  }

  private async fetchDirectMessages(currentUser: Profile,selectedUser: Profile):
   Promise<any[] | null> {
    const filter = this.createConversationFilter(currentUser, selectedUser);
    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .select('id,sender_id,receiver_id,text,created_at')
      .or(filter)
      .order('created_at', { ascending: true });

    if (!error) return data;
    console.error('Fehler beim Laden der Direktnachrichten:', error);
    return null;
  }

  // Builds a bidirectional filter so both sent and received
  // messages belong to the same DM conversation.
  private createConversationFilter(currentUser: Profile,selectedUser: Profile):string{
    return `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),`
      + `and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`;
  }

  private setDirectMessages(data: any[], currentUser: Profile,selectedUser: Profile): 
  void {
    const messages = data.map((message) =>
      this.mapDirectMessage(message, currentUser, selectedUser)
    );
    this.directMessages.set(messages);
  }

  async updateDirectMessage(messageId: string, newText: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    const text = newText.trim();

    if (!currentUser || !text) return;

    const data = await this.updateDirectMessageRecord(messageId,text,currentUser.id);
    this.updateDirectMessageState(messageId, data.text);
  }

  private async updateDirectMessageRecord(messageId: string, text: string,
    userId: string): Promise<any> {
    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .update({ text })
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select()
      .single();

    if (error) this.throwUpdateError(error);
    return data;
  }

  private throwUpdateError(error: unknown): never {
    console.error('Fehler beim Bearbeiten der Direktnachricht:', error);
    throw error;
  }

  private updateDirectMessageState(messageId: string,text: string): void {
    this.directMessages.update((messages) =>
      messages.map((message) =>
        message.id === messageId ? { ...message, text } : message));
  }

  async sendDirectMessage(text: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();
    const authUser = this.authService.currentUser();

    if (!authUser || !currentUser || !selectedUser) {
      console.error('Kein Benutzer oder DM-Partner ausgewählt');
      return;
    }
    const data = await this.insertDirectMessage( authUser.id,selectedUser.id,text);
    if (!data) return;
    this.addSentMessage(data, currentUser, selectedUser);
  }

  private async insertDirectMessage(senderId: string,receiverId: string,
    text: string): Promise<any | null> {
    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, text })
      .select()
      .single();

    if (!error) return data;
    console.error('Fehler beim Senden der Direktnachricht:', error);
    return null;
  }

  private addSentMessage(data: any,currentUser: Profile,selectedUser: Profile): void {
    const message = this.mapDirectMessage(data,currentUser,selectedUser);
    this.addMessageIfMissing(message);
  }

  // Prevents duplicate messages when the sender receives
  // the same insert again through the realtime subscription.
  private addMessageIfMissing(message: MessageView): void {
    this.directMessages.update((messages) => {
      const exists = messages.some((item) => item.id === message.id);
      return exists ? messages : [...messages, message];
    });
  }

  // Replaces the previous DM listener whenever
  // the active conversation changes.
  listenToDirectMessages(): void {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();

    if (!currentUser || !selectedUser) return;
    this.removeDmRealtimeChannel();
    this.dmRealtimeChannel = this.createDmRealtimeChannel(currentUser,selectedUser);
  }

  private createDmRealtimeChannel(currentUser: Profile,selectedUser: Profile): RealtimeChannel {
    return this.supabase.supabase
      .channel(`direct-messages-${currentUser.id}-${selectedUser.id}`)
      .on('postgres_changes', this.getDmRealtimeConfig(),
      (payload) => this.handleDmRealtimePayload(payload,currentUser,selectedUser))
      .subscribe();
  }

  // Listen for both inserts and updates so new messages
  // and edits can be synchronized in realtime.
  private getDmRealtimeConfig() {
    return {
      event: '*' as const,
      schema: 'public',
      table: 'direct_messages',
    };
  }

  // Ignores realtime events that do not belong
  // to the currently selected DM conversation.
  private handleDmRealtimePayload(payload: any, currentUser: Profile,
    selectedUser: Profile): void {
    const changedMessage = payload.new as any;
    if (!changedMessage?.id) return;
    if (!this.belongsToCurrentConversation(changedMessage)) return;

    const message = this.mapDirectMessage(changedMessage,currentUser,selectedUser);
    this.applyRealtimeChange(payload.eventType, message);
  }

  private applyRealtimeChange(eventType: string, message: MessageView): void {
    if (eventType === 'INSERT') {
      this.addMessageIfMissing(message);
      return;
    }

    if (eventType === 'UPDATE') {
      this.replaceDirectMessage(message);
    }
  }

  private replaceDirectMessage(message: MessageView): void {
    this.directMessages.update((messages) =>
      messages.map((item) =>
        item.id === message.id ? message : item));
  }

  removeDmRealtimeChannel(): void {
    if (!this.dmRealtimeChannel) return;

    this.supabase.supabase.removeChannel(this.dmRealtimeChannel);
    this.dmRealtimeChannel = null;
  }

  private belongsToCurrentConversation(message: any): boolean {
    const currentUser = this.authService.currentUserProfile();
    const selectedUser = this.currentDmUser();

    if (!currentUser || !selectedUser) return false;
    return this.isMessageBetweenUsers(message, currentUser.id,selectedUser.id);
  }

  private isMessageBetweenUsers(message: any,currentUserId: string,
    selectedUserId: string): boolean {
    const sentByCurrentUser =
      message.sender_id === currentUserId &&
      message.receiver_id === selectedUserId;

    const sentBySelectedUser =
      message.sender_id === selectedUserId &&
      message.receiver_id === currentUserId;

    return sentByCurrentUser || sentBySelectedUser;
  }

  // Converts the database record into the UI model
  // using the correct participant identity for each message.
  private mapDirectMessage(message: any, currentUser: Profile,selectedUser: Profile):
   MessageView {
    const isOwnMessage = message.sender_id === currentUser.id;

    return {
      id: message.id,
      authorName: isOwnMessage ? currentUser.name : selectedUser.name,
      avatar: this.getMessageAvatar(isOwnMessage,currentUser,selectedUser),
      text: message.text,
      time: this.formatTime(message.created_at),
      createdAt: message.created_at,
      isOwnMessage,
    };
  }

  private getMessageAvatar(isOwnMessage: boolean,currentUser: Profile,
    selectedUser: Profile): string {
    const fallback = 'assets/img/avatar/avatar-3.png';
    return isOwnMessage
      ? currentUser.avatar || fallback
      : selectedUser.avatar || fallback;
  }

  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Loads the selected conversation first, then starts
  // its realtime synchronization.
  async selectDmUser(user: Profile): Promise<void> {
    this.currentDmUser.set(user);
    await this.loadDirectMessages();
    this.listenToDirectMessages();
  }
}