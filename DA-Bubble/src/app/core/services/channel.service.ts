import { inject, Injectable, signal } from '@angular/core';
import { Channel } from "../models/channel.model";
import { Supabase } from '../supabase/supabase.service';


@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private supabase = inject(Supabase);
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
}
