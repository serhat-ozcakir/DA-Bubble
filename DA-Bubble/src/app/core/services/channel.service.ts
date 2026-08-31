import { inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Channel } from '../models/channel.model';
import { Profile } from '../models/profile.model';
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private supabase = inject(Supabase);
  private authService = inject(Auth);
  private channelMembersRealtimeChannel: RealtimeChannel | null = null;
  private channelRealtimeChannel: RealtimeChannel | null = null;
  private userChannelsRealtimeChannel: RealtimeChannel | null = null;


  channels = signal<Channel[]>([]);
  currentChannel = signal<Channel | null>(null);
  channelMembers = signal<Profile[]>([]);
  creator = signal<Profile | null>(null);

  async loadChannels(): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    if (!currentUser) {
      this.clearChannelState();
      return;
    }
    const data = await this.fetchUserChannels(currentUser.id);
    this.setLoadedChannels(data);
  }

  listenToUserChannels(): void {
    const user = this.authService.currentUserProfile();
    if (!user) return;
    this.removeUserChannelsRealtimeChannel();
    this.userChannelsRealtimeChannel = this.createUserChannelsRealtimeChannel(user.id);
  }

  private createUserChannelsRealtimeChannel(profileId: string): RealtimeChannel {
    return this.supabase.supabase
      .channel(`user-channels-${profileId}`)
      .on('postgres_changes', this.getUserChannelsRealtimeConfig(profileId),
        () => this.loadChannels()
      )
      .subscribe();
  }

  private getUserChannelsRealtimeConfig(profileId: string) {
    return {
      event: '*' as const,
      schema: 'public',
      table: 'channel_members',
      filter: `profile_id=eq.${profileId}`,
    };
  }

  removeUserChannelsRealtimeChannel(): void {
    if (!this.userChannelsRealtimeChannel) return;
    this.supabase.supabase.removeChannel(this.userChannelsRealtimeChannel);
    this.userChannelsRealtimeChannel = null;
  }

  private async fetchUserChannels(profileId: string): Promise<any[]> {
    const { data, error } = await this.supabase.supabase
      .from('channel_members')
      .select(`channels (id, name, description, created_by, created_at)`)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Kanäle:', error);
      return [];
    }
    return data;
  }

  private setLoadedChannels(data: any[]): void {
    const loadedChannels = data
      .map((membership: any) => membership.channels)
      .filter((channel): channel is any => !!channel)
      .map((channel) => this.mapChannel(channel));

    this.channels.set(loadedChannels);
    if (loadedChannels.length === 0) this.clearSelectedChannel();
  }

  private clearChannelState(): void {
    this.channels.set([]);
    this.currentChannel.set(null);
  }

  private clearSelectedChannel(): void {
    this.currentChannel.set(null);
    this.channelMembers.set([]);
  }

  async loadChannelCreator(profileId: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .select('id,email, name, avatar, status, is_guest')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Fehler beim Laden des Channel-Erstellers:', error);
      return;
    }
    this.creator.set(data);
  }

  async loadChannelMembers(channelId: string): Promise<void> {
    const data = await this.fetchChannelMembers(channelId);
    if (!data) return;

    const members = data
      .map((member: any) => member.profiles)
      .filter((profile) => profile !== null);
    this.channelMembers.set(members);
  }

  private async fetchChannelMembers(channelId: string): Promise<any[] | null> {
    const { data, error } = await this.supabase.supabase
      .from('channel_members')
      .select(`profiles (id, name, email, avatar, status, created_at)`)
      .eq('channel_id', channelId);

    if (error) {
      console.error('Fehler beim Laden der Kanalmitglieder:', error);
      return null;
    }
    return data;
  }

  // Synchronizes channel data and realtime subscriptions
  // whenever the active channel changes.
  setCurrentChannel(channel: Channel): void {
    this.currentChannel.set(channel);
    this.loadChannelMembers(channel.id);
    this.loadChannelCreator(channel.createdBy);
    this.subscribeToCurrentChannelMembers();
    this.subscribeToCurrentChannel();
  }

  // Replaces the previous channel listener to prevent
  // stale subscriptions when switching channels.
  private subscribeToCurrentChannel(): void {
    const channel = this.currentChannel();
    if (!channel) return;
    this.removeChannelRealtimeChannel();
    this.channelRealtimeChannel = this.createChannelRealtimeChannel(channel.id);
  }

  private createChannelRealtimeChannel(channelId: string): RealtimeChannel {
    return this.supabase.supabase
      .channel(`channel-live-${channelId}`)
      .on('postgres_changes', this.getChannelRealtimeConfig(channelId),
        (payload) => this.handleChannelUpdate(payload.new))
      .subscribe();
  }

  private handleChannelUpdate(channel: any): void {
    if (!channel?.id) return;
    this.updateChannelState(this.mapChannel(channel));
  }

  private removeChannelRealtimeChannel(): void {
    if (!this.channelRealtimeChannel) return;
    this.supabase.supabase.removeChannel(this.channelRealtimeChannel);
    this.channelRealtimeChannel = null;
  }

  // Listen only for updates to the active channel
  // to avoid processing unrelated channel changes.
  private getChannelRealtimeConfig(channelId: string) {
    return {
      event: 'UPDATE' as const,
      schema: 'public',
      table: 'channels',
      filter: `id=eq.${channelId}`,
    };
  }

  // Creates the channel and registers its creator
  // as the initial owner membership.
  async createChannel(name: string, description: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    if (!currentUser) return;

    await this.ensureChannelNameAvailable(name);
    const channel = await this.createChannelRecord(name, description, currentUser.id);
    await this.addChannelOwner(channel.id, currentUser.id);
    this.addCreatedChannelToState(channel);
  }

  private async ensureChannelNameAvailable(name: string): Promise<void> {
    const { data } = await this.supabase.supabase
      .from('channels')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (data) throw new Error('CHANNEL_ALREADY_EXISTS');
  }

  private async createChannelRecord(name: string, description: string,
    userId: string): Promise<any> {
    const { data, error } = await this.supabase.supabase
      .from('channels')
      .insert([{ name, description, created_by: userId }])
      .select()
      .single();

    if (error) this.throwCreateChannelError(error);
    return data;
  }

  private throwCreateChannelError(error: unknown): never {
    console.error('Fehler beim Erstellen des Kanals:', error);
    throw new Error(
      'Fehler beim Erstellen des Kanals. Bitte versuchen Sie es erneut.'
    );
  }

  private async addChannelOwner(channelId: string, profileId: string): Promise<void> {
    await this.supabase.supabase
      .from('channel_members')
      .insert([{ channel_id: channelId, profile_id: profileId, role: 'owner', }]);
  }

  private addCreatedChannelToState(channel: any): void {
    this.channels.update((channels) => [...channels, channel]);
    this.currentChannel.set(channel);
  }

  async addMembersToChannel(channelId: string, profileIds: string[]): Promise<void> {
    const members = this.createMemberRecords(channelId, profileIds);
    const { error } = await this.supabase.supabase
      .from('channel_members')
      .insert(members);

    if (error) {
      console.error('Error adding the member to the channel:', error);
      throw error;
    }
    this.loadChannelMembers(channelId);
  }

  private createMemberRecords(channelId: string, profileIds: string[]) {
    return profileIds.map((profileId) => ({
      channel_id: channelId,
      profile_id: profileId,
      role: 'member',
    }));
  }

  // Keeps member updates bound to the currently active channel
  // and replaces the previous realtime subscription.
  subscribeToCurrentChannelMembers(): void {
    const channel = this.currentChannel();
    if (!channel) return;
    this.removeMembersRealtimeChannel();
    this.channelMembersRealtimeChannel = this.createMembersRealtimeChannel(
      channel.id
    );
  }

  private removeMembersRealtimeChannel(): void {
    if (!this.channelMembersRealtimeChannel) return;
    this.supabase.supabase.removeChannel(this.channelMembersRealtimeChannel);
  }

  private createMembersRealtimeChannel(channelId: string): RealtimeChannel {
    return this.supabase.supabase
      .channel(`channel-members-live-${channelId}`)
      .on('postgres_changes', this.getChannelMembersRealtimeConfig(),
        () => this.reloadActiveChannelMembers())
      .subscribe();
  }

  // Reload the active member list for any membership change
  // so joins, removals and role changes stay synchronized.
  private getChannelMembersRealtimeConfig() {
    return {
      event: '*' as const,
      schema: 'public',
      table: 'channel_members',
    };
  }

  private async reloadActiveChannelMembers(): Promise<void> {
    const activeChannel = this.currentChannel();
    if (!activeChannel) return;
    await this.loadChannelMembers(activeChannel.id);
  }

  async leaveChannel(channelId: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    if (!currentUser) {
      throw new Error('User not found');
    }
    await this.deleteChannelMembership(channelId, currentUser.id);
    this.removeChannelFromState(channelId);
  }

  private async deleteChannelMembership(channelId: string, profileId: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('profile_id', profileId);

    if (!error) return;
    console.error('Error leaving channel:', error);
    throw error;
  }

  // Selects the next available channel after leaving
  // so the workspace does not keep a removed channel active.
  private removeChannelFromState(channelId: string): void {
    this.channels.update((channels) =>
      channels.filter((channel) => channel.id !== channelId)
    );

    const nextChannel = this.channels()[0] ?? null;
    this.currentChannel.set(nextChannel);
    this.loadNextChannelMembers(nextChannel);
  }

  private loadNextChannelMembers(channel: Channel | null): void {
    if (channel) {
      this.loadChannelMembers(channel.id);
      return;
    }
    this.channelMembers.set([]);
  }

  async updateChannelName(channelId: string, newName: string): Promise<void> {
    const trimmedName = newName.trim();
    await this.ensureUpdatedNameAvailable(channelId, trimmedName);
    const data = await this.updateChannelNameRecord(channelId, trimmedName);
    this.updateChannelState(this.mapChannel(data));
  }

  private async ensureUpdatedNameAvailable(channelId: string, name: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('channels')
      .select('id')
      .eq('name', name)
      .neq('id', channelId)
      .maybeSingle();

    if (error) throw error;
    if (data) throw new Error('CHANNEL_ALREADY_EXISTS');
  }

  private async updateChannelNameRecord(channelId: string, name: string): Promise<any> {
    const { data, error } = await this.supabase.supabase
      .from('channels')
      .update({ name })
      .eq('id', channelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateChannelDescription(channelId: string, newDescription: string): Promise<void> {
    const description = newDescription.trim();
    const data = await this.updateDescriptionRecord(channelId, description);
    this.updateChannelState(this.mapChannel(data));
  }

  private async updateDescriptionRecord(channelId: string, description: string): Promise<any> {
    const { data, error } = await this.supabase.supabase
      .from('channels')
      .update({ description })
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Channel description update error:', error);
      throw error;
    }
    return data;
  }

  // Keeps the channel list and active channel in sync
  // after local or realtime updates.
  private updateChannelState(updatedChannel: Channel): void {
    this.channels.update((channels) =>
      channels.map((channel) =>
        channel.id === updatedChannel.id ? updatedChannel : channel));
    this.currentChannel.set(updatedChannel);
  }

  private mapChannel(channel: any): Channel {
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      createdBy: channel.created_by,
      createdAt: channel.created_at,
    };
  }
}