import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';
import { SearchResult } from '../models/search-result.model';
import { Auth } from './auth.service';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root',
})
export class Search {
  private supabase = inject(Supabase);
  private authService = inject(Auth);
  results = signal<SearchResult[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  async searchChannelMessages(searchTerm: string): Promise<void> {
    const term = searchTerm.trim();

    if (term.length < 2) {
      this.clearSearch();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select(`
        id,
        text,
        created_at,
        channel_id,
        profiles (
          id,
          name,
          avatar
        )
      `)
      .ilike('text', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.log('Error:', error);
      this.results.set([]);
      this.errorMessage.set('Die Nachrichten konnten nicht durchsucht werden.');
      this.isLoading.set(false);
      return;
    }

    const searchResults: SearchResult[] = data.map((message: any) => ({
      id: message.id,
      type: 'channel-message',
      text: message.text,
      authorName: message.profiles?.name ?? 'Unbekannter Benutzer',
      avatar:
        message.profiles?.avatar ??
        'assets/img/avatar/avatar-3.png',
      channelId: message.channel_id,
      createdAt: message.created_at,
    }));

    const directMessageResults = await this.searchDirectMessages(term);

    this.results.set([
      ...searchResults,
      ...directMessageResults,
    ]);
    this.isLoading.set(false);
  }

  clearSearch(): void {
    this.results.set([]);
    this.errorMessage.set('');
    this.isLoading.set(false);
  }

  async searchDirectMessages(searchTerm: string): Promise<SearchResult[]> {
    const currentUser = this.authService.currentUserProfile();
    const term = searchTerm.trim();

    if (!currentUser || term.length < 2) {
      return [];
    }

    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .select(`
      id,
      text,
      created_at,
      sender_id,
      receiver_id
    `)
      .or(
        `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
      )
      .ilike('text', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    const users = await this.loadProfiles();

    return data.map((message) => {
      const otherUserId =
        message.sender_id === currentUser.id
          ? message.receiver_id
          : message.sender_id;

      const otherUser = users.find(
        (user) => user.id === otherUserId
      );

      return {
        id: message.id,
        type: 'direct-message' as const,
        text: message.text,
        authorName: otherUser?.name ?? 'Unbekannter Benutzer',
        avatar:
          otherUser?.avatar ?? 'assets/img/avatar/avatar-3.png',
        profileId: otherUserId,
        createdAt: message.created_at,
      };
    });
  }

  private async loadProfiles(): Promise<Profile[]> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  }
}
