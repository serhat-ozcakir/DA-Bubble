import { inject, Injectable, signal } from '@angular/core';
import { Channel } from "../models/channel.model";
import { Supabase } from '../supabase/supabase.service';
import { Auth } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private supabase = inject(Supabase);
  private authService = inject(Auth);  
  channels = signal<Channel[]>([]);
  currentChannel = signal<Channel | null>(null);

  async loadChannels(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Kanäle:', error);
      return;
    }

    const loadedChannels: Channel[] = data.map((channel) => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      createdBy: channel.created_by,
      createdAt: channel.created_at,
    }));

    this.channels.set(loadedChannels);
    if (loadedChannels.length > 0) {
      this.currentChannel.set(loadedChannels[0]);
    }
  }

  setCurrentChannel(channel: Channel): void {
    this.currentChannel.set(channel);
  }

  async createChannel(name: string, description: string): Promise<void> {
    const currentUser = this.authService.currentUserProfile();

    if(!currentUser) return;
    
    const {data:existingChannel, error: checkError} = await this.supabase.supabase
      .from('channels')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
      if(existingChannel) {
        throw new Error('CHANNEL_ALREADY_EXISTS');
      }
     

    const { data:channel, error } = await this.supabase.supabase
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
      .insert([{ channel_id: channel.id, 
        profile_id: currentUser?.id ,
        role:'owner'}]);

    this.channels.update((channels) => [...channels, channel]); 
    this.currentChannel.set(channel);
}
}
