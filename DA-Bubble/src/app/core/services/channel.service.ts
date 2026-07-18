import { inject, Injectable, signal } from '@angular/core';
import { Channel } from "../models/channel.model";
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';
import { Profile } from '../models/profile.model';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private supabase = inject(Supabase);
  private authService = inject(Auth);
  channels = signal<Channel[]>([]);
  currentChannel = signal<Channel | null>(null);
  channelMembers = signal<Profile[]>([]);
  creator =  signal<Profile | null>(null);
  private channelMembersRealtimeChannel: RealtimeChannel | null = null;

  async loadChannels(): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    if (!currentUser) {
      this.channels.set([]);
      this.currentChannel.set(null);
      return;
    }

    const { data, error } = await this.supabase.supabase
      .from('channel_members')
      .select(`
      channels (
        id,
        name,
        description,
        created_by,
        created_at
      )
    `)
      .eq('profile_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Kanäle:', error);
      return;
    }

    const loadedChannels: Channel[] = data
      .map((membership: any) => membership.channels)
      .filter((channel): channel is any => !!channel)
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        createdBy: channel.created_by,
        createdAt: channel.created_at,
      }));

    this.channels.set(loadedChannels);

    if (loadedChannels.length > 0) {
      this.currentChannel.set(loadedChannels[0]);
      await this.loadChannelMembers(loadedChannels[0].id);
       await this.loadChannelCreator(loadedChannels[0].createdBy);
      this.subscribeToCurrentChannelMembers();
    } else {
      this.currentChannel.set(null);
      this.channelMembers.set([]);
    }
  }

async loadChannelCreator(profileId: string): Promise<void> {
  const { data, error } = await this.supabase.supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Fehler beim Laden des Channel-Erstellers:', error);
    return;
  }

  this.creator.set(data);
}

async loadChannelMembers(channelId: string): Promise<void> {
  const { data, error } = await this.supabase.supabase
    .from('channel_members')
    .select(`
      profiles (
        id,
        name,
        email,
        avatar,
        status,
        created_at
      )
    `)
    .eq('channel_id', channelId);

  if (error) {
    console.error('Fehler beim Laden der Kanalmitglieder:', error);
    return;
  }

  const members: Profile[] = data
    .map((member: any) => member.profiles)
    .filter((profile) => profile !== null);

  this.channelMembers.set(members);
}

  setCurrentChannel(channel: Channel): void {
    this.currentChannel.set(channel);
    this.loadChannelMembers(channel.id);
    this.loadChannelCreator(channel.createdBy);
    this.subscribeToCurrentChannelMembers();
  }

  async createChannel(name: string, description: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();
    if (!currentUser) return;

    const { data: existingChannel, error: checkError } = await this.supabase.supabase
      .from('channels')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (existingChannel) {
      throw new Error('CHANNEL_ALREADY_EXISTS');
    }

    const { data: channel, error } = await this.supabase.supabase
      .from('channels')
      .insert([{ name, description, created_by: currentUser?.id }])
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen des Kanals:', error);
      throw new Error('Fehler beim Erstellen des Kanals. Bitte versuchen Sie es erneut.');
    }

    await this.supabase.supabase
      .from('channel_members')
      .insert([{
        channel_id: channel.id,
        profile_id: currentUser?.id,
        role: 'owner'
      }]);

    this.channels.update((channels) => [...channels, channel]);
    this.currentChannel.set(channel);
  }
  async addMembersToChannel(channelId: string, profileIds: string[]): Promise<void> {
    const members = profileIds.map((profileId) => ({
      channel_id: channelId,
      profile_id: profileId,
      role: 'member',
    }));

    const { error } = await this.supabase.supabase
      .from('channel_members')
      .insert(members);

    if (error) {
      console.error('Error adding the member to the channel:', error);
      throw error
    }

    this.loadChannelMembers(channelId);
  }

subscribeToCurrentChannelMembers(): void {
  const currentChannel = this.currentChannel();

  if (!currentChannel) {
    return;
  }

  if (this.channelMembersRealtimeChannel) {
    this.supabase.supabase.removeChannel(
      this.channelMembersRealtimeChannel
    );
  }

  this.channelMembersRealtimeChannel = this.supabase.supabase
    .channel(`channel-members-live-${currentChannel.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'channel_members',
      },
      async () => {
        const activeChannel = this.currentChannel();

        if (!activeChannel) {
          return;
        }

        await this.loadChannelMembers(activeChannel.id);
      }
    )
    .subscribe();
}

  async leaveChannel(channelId: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    if (!currentUser) {
      throw new Error('User not found')
    }

    const { error } = await this.supabase.supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('profile_id', currentUser?.id)

    if (error) {
      console.log('Error leaving channel:', error);
      throw error
    }
    this.removeChannelFromState(channelId)
  }

  private removeChannelFromState(channelId: string): void {
    this.channels.update((channels) =>
      channels.filter((channel) => channel.id !== channelId));

    const nextChannel = this.channels()[0] ?? null;
    this.currentChannel.set(nextChannel);

    if (nextChannel) {
      this.loadChannelMembers(nextChannel.id);
    } else {
      this.channelMembers.set([])
    }
  }

}
