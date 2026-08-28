import { inject, Injectable, signal } from '@angular/core';
import {Profile} from "../models/profile.model";
import {Supabase} from "../supabase/supabase.service";

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private supabase = inject(Supabase);
  user = signal<Profile[]>([]);

  constructor() {
}

async loadUsers(): Promise<void> {
  const { data, error } = await this.supabase.supabase.from('profiles').select('*');
  if (error) {
    console.error('Error loading users:', error);
    return;
  } 
   this.user.set(data);
}

}