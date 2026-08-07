import { Injectable, signal } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { Profile } from '../models/profile.model';

export interface RegisterData {

  name: string;
  email: string;
  password: string;
  avatar?: string;
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

  async ensureGoogleProfile(): Promise<boolean> {
    const { data, error } =
      await this.supabase.supabase.auth.getUser();

    if (error) {
      throw error;
    }

    const user = data.user;

    if (!user) {
      throw new Error('Google user could not be loaded.');
    }

    const { data: existingProfile, error: profileError } =
      await this.supabase.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (existingProfile) {
      this.currentUser.set(user);
      this.currentUserProfile.set(existingProfile);

      return false;
    }

    const googleName =
      user.user_metadata?.['full_name'] ??
      user.user_metadata?.['name'] ??
      user.email?.split('@')[0] ??
      'User';

    const { data: newProfile, error: insertError } =
      await this.supabase.supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email ?? '',
          name: googleName,
          avatar: 'assets/logo/Profile.png',
          status: 'offline',
        })
        .select()
        .single();

    if (insertError) {
      throw insertError;
    }

    this.currentUser.set(user);
    this.currentUserProfile.set(newProfile);

    return true;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } =
      await this.supabase.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      throw error;
    }
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
    this.currentUser.set(null);
    this.currentUserProfile.set(null);

    const { data, error } = await this.supabase.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    await this.loadCurrentUser();
    await this.updateStatus('online');
    await this.loadCurrentUser();

    return data;
  }

  async logout() {
    await this.updateStatus('offline');
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
    if (this.isGuestUser()) {
      throw new Error(
        'Gastbenutzer können ihr Profil nicht bearbeiten.'
      );
    }
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

  async updateStatus(status: 'online' | 'offline') {
    const user = this.currentUser();

    if (!user) return;

    const { data, error } = await this.supabase.supabase.from('profiles')
      .update({ status })
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }
    this.currentUserProfile.set(data);
    return data;
  }

  async updateCurrentUserAvatar(avatar: string): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await this.supabase.supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('No authenticated user found.');
    }

    const { data: updatedProfile, error: updateError } =
      await this.supabase.supabase
        .from('profiles')
        .update({
          avatar,
          status: 'online',
        })
        .eq('id', user.id)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    this.currentUser.set(user);
    this.currentUserProfile.set(updatedProfile);
  }

  async guestLogin(): Promise<void> {
    this.currentUser.set(null);
    this.currentUserProfile.set(null);

    const { data, error } =
      await this.supabase.supabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }

    const guestUser = data.user;

    if (!guestUser) {
      throw new Error(
        'Gastbenutzer konnte nicht erstellt werden.'
      );
    }

    const guestName = `Gast ${guestUser.id.slice(-4)}`;

    const guestAvatars = [
      'assets/img/avatar/avatar-1.png',
      'assets/img/avatar/avatar-2.png',
      'assets/img/avatar/avatar-3.png',
      'assets/img/avatar/avatar-4.png',
      'assets/img/avatar/avatar-5.png',
      'assets/img/avatar/avatar-6.png',
    ];

    const randomAvatar =
      guestAvatars[
      Math.floor(Math.random() * guestAvatars.length)
      ];

    const { data: guestProfile, error: profileError } =
      await this.supabase.supabase
        .from('profiles')
        .insert({
          id: guestUser.id,
          email: null,
          name: guestName,
          avatar: randomAvatar,
          status: 'online',
          is_guest: true,
        })
        .select()
        .single();

    if (profileError) {
      await this.supabase.supabase.auth.signOut();
      throw profileError;
    }

    await this.addGuestToWelcomeChannel(guestUser.id);

    this.currentUser.set(guestUser);
    this.currentUserProfile.set(guestProfile);
    await this.loadCurrentUser();

    if (!this.currentUserProfile()) {
      throw new Error('Das Gastprofil konnte nicht geladen werden.');
    }
  }

  private async addGuestToWelcomeChannel(
    guestUserId: string
  ): Promise<void> {
    const { data: welcomeChannel, error: channelError } =
      await this.supabase.supabase
        .from('channels')
        .select('id')
        .eq('name', 'Willkommen')
        .maybeSingle();

    if (channelError) {
      throw channelError;
    }

    if (!welcomeChannel) {
      throw new Error(
        'Der Channel "Willkommen" wurde nicht gefunden.'
      );
    }

    const { error: membershipError } =
      await this.supabase.supabase
        .from('channel_members')
        .insert({
          channel_id: welcomeChannel.id,
          profile_id: guestUserId,
          role: 'member',
        });

    if (membershipError) {
      console.error(
        'Fehler beim Hinzufügen zum Willkommen-Channel:',
        membershipError
      );

      throw membershipError;
    }
  }

  isGuestUser(): boolean {
    const profile = this.currentUserProfile();
    return profile?.is_guest === true;
  }

}