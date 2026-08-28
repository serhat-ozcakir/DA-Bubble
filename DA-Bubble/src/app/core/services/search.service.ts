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

    this.startSearch();

    const channelResults = await this.fetchChannelResults(term);
    if (!channelResults) return;

    const directResults = await this.searchDirectMessages(term);
    this.finishSearch([...channelResults, ...directResults]);
  }

  private startSearch(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  private finishSearch(results: SearchResult[]): void {
    this.results.set(results);
    this.isLoading.set(false);
  }

  private async fetchChannelResults(term: string): Promise<SearchResult[] | null> {
    const { data, error } = await this.supabase.supabase
      .from('messages')
      .select(`id, text,  created_at, channel_id, profiles (
          id, name, avatar )`)
      .ilike('text', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) {
      return data.map((message) =>
        this.mapChannelSearchResult(message)
      );
    }

    this.handleChannelSearchError(error);
    return null;
  }

  private mapChannelSearchResult(message: any): SearchResult {
    return {
      id: message.id,
      type: 'channel-message',
      text: message.text,
      authorName: message.profiles?.name ?? 'Unbekannter Benutzer',
      avatar:
        message.profiles?.avatar ??
        'assets/img/avatar/avatar-3.png',
      channelId: message.channel_id,
      createdAt: message.created_at,
    };
  }

  private handleChannelSearchError(error: unknown): void {
    console.log('Error:', error);
    this.results.set([]);
    this.errorMessage.set(
      'Die Nachrichten konnten nicht durchsucht werden.'
    );
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

    if (!currentUser || term.length < 2) return [];

    const data = await this.fetchDirectMessages(term, currentUser.id);
    const users = await this.loadProfiles();

    return data.map((message) =>
      this.mapDirectSearchResult(message, currentUser.id, users)
    );
  }

  private async fetchDirectMessages(term: string, currentUserId: string): Promise<any[]> {
    const { data, error } = await this.supabase.supabase
      .from('direct_messages')
      .select(`id, text, created_at, sender_id, receiver_id`).or(
        `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
      )
      .ilike('text', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  }

  private mapDirectSearchResult( message: any, currentUserId: string,users: Profile[]): SearchResult {
    const otherUserId = this.getOtherUserId(
      message,
      currentUserId
    );

    const otherUser = users.find(
      (user) => user.id === otherUserId
    );

    return {id: message.id, type: 'direct-message',text: message.text,
      authorName: otherUser?.name ?? 'Unbekannter Benutzer',
      avatar: otherUser?.avatar ?? 'assets/img/avatar/avatar-3.png',
      profileId: otherUserId,
      createdAt: message.created_at,
    };
  }

  private getOtherUserId( message: any, currentUserId: string): string {
    return message.sender_id === currentUserId
      ? message.receiver_id
      : message.sender_id;
  }

  private async loadProfiles(): Promise<Profile[]> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data;
  }
}