import { Injectable, signal } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';
import { User } from '@supabase/supabase-js';

export interface RegisterData {

  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  created_at?: string;
}


@Injectable({
  providedIn: 'root',
})

export class Auth {
  private RegisterData?: RegisterData;

  currentUser = signal<User | null>(null);
  currentUserProfile = signal<Profile | null>(null);

  constructor(private supabase: Supabase) {

  }

  setRegisterData(data: RegisterData): void {
    this.RegisterData = data;
  }

  getRegisterData(): RegisterData | undefined {
    return this.RegisterData;
  }

  setAvatar(avatar: string): void {
    if (!this.RegisterData) return;
    this.RegisterData.avatar = avatar;
  }
  clearRegisterData(): void {
    this.RegisterData = undefined;
  }

  async loadCurrentUser() {
    const { data, error } = await this.supabase.supabase.auth.getUser();

    if (error || !data.user) {
      this.currentUser.set(null);
      this.currentUserProfile.set(null);
      return;
    }
    this.currentUser.set(data.user);

    const { data: profile, error: profileError } = await this.supabase.supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    this.currentUserProfile.set(profile);

  }

  async signUp() {
    if (!this.RegisterData) {
      throw new Error('Register data is not set.');
    }
    const { email, password, name, avatar } = this.RegisterData;
    const { data, error } = await this.supabase.supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      throw error;
    }

    if (!data.user) {
      this.clearRegisterData();
      throw new Error('User data is missing after sign up.');
    }

    const { error: profileError } = await this.supabase.supabase.from('profiles').insert({
      id: data.user.id,
      email,
      name,
      avatar,
      status: 'offline',
    })

    if (profileError) {
      throw profileError;
    }

    this.clearRegisterData();

    return data;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      throw error;
    }
    await this.loadCurrentUser();
    return data;
  }

  async logout() {
    const { error } = await this.supabase.supabase.auth.signOut();
    if (error) {
      throw error;
    }
    this.currentUser.set(null);
    this.currentUserProfile.set(null);
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:4200/reset-password',

    });
    if (error) {
      throw error;
    }
    return data;
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      throw error;
    }
    return data;
  }

  async updateProfileName(name: string) {
    const user = this.currentUser();
    if (!user) {
      throw new Error('No user is currently logged in.');
    }
    const { data, error } = await this.supabase.supabase.from('profiles')
      .update({ name })
      .eq('id', user.id)
      .select()
      .maybeSingle();
      
      if (error) {
        throw error;
      }
      this.currentUserProfile.set(data);
      return data;
  }


}