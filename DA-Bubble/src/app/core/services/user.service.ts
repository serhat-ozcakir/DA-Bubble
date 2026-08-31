import { inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Profile } from "../models/profile.model";
import { Supabase } from "../supabase/supabase.service";

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private supabase = inject(Supabase);
  private usersRealtimeChannel: RealtimeChannel | null = null;

  user = signal<Profile[]>([]);

  async loadUsers(): Promise<void> {
    const { data, error } = await this.supabase.supabase.from('profiles').select('*');
    if (error) {
      console.error('Error loading users:', error);
      return;
    }
    this.user.set(data);
  }

  listenToUsers(): void {
    this.removeUsersRealtimeChannel();
    this.usersRealtimeChannel = this.supabase.supabase
      .channel('profiles-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => this.loadUsers()
      )
      .subscribe();
  }

  removeUsersRealtimeChannel(): void {
    if (!this.usersRealtimeChannel) return;
    this.supabase.supabase.removeChannel(
      this.usersRealtimeChannel
    );
    this.usersRealtimeChannel = null;
  }
}