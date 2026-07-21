import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';
import { SearchResult } from '../models/search-result.model';

@Injectable({
  providedIn: 'root',
})
export class Search {
  private supabase = inject(Supabase);
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

    if(error){
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

    this.results.set(searchResults);
    this.isLoading.set(false);
  }

  clearSearch():void{
    this.results.set([]);
    this.errorMessage.set('');
    this.isLoading.set(false);    
  }
}
