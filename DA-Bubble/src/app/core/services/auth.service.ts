import { Injectable, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from '../supabase/supabase.service';
import { Profile } from '../models/profile.model';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

// Local avatar pool used to give temporary guest accounts
// a distinct visual identity.
const GUEST_AVATARS = [
  'assets/img/avatar/avatar-1.png',
  'assets/img/avatar/avatar-2.png',
  'assets/img/avatar/avatar-3.png',
  'assets/img/avatar/avatar-4.png',
  'assets/img/avatar/avatar-5.png',
  'assets/img/avatar/avatar-6.png',
];

@Injectable({
  providedIn: 'root',
})

export class Auth {
  private registerData?: RegisterData;
  currentUser = signal<User | null>(null);
  currentUserProfile = signal<Profile | null>(null);

  constructor(private supabase: Supabase) {}

  // Ensures OAuth users also have an application profile
  // because Supabase Auth and profile data are stored separately.
  async ensureGoogleProfile(): Promise<boolean> {
    const user = await this.getAuthenticatedUser(
      'Google user could not be loaded.'
    );
    const profile = await this.getProfile(user.id);
    if (profile) {
      this.setCurrentSession(user, profile);
      return false;
    }
    return this.createMissingGoogleProfile(user);
  }

  private async createMissingGoogleProfile(user: User): Promise<boolean> {
    const profile = await this.createGoogleProfile(user);
    this.setCurrentSession(user, profile);
    return true;
  }

  private async createGoogleProfile(user: User): Promise<Profile> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .insert(this.buildGoogleProfile(user))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private buildGoogleProfile(user: User) {
    return {
      id: user.id,
      email: user.email ?? '',
      name: this.getGoogleUserName(user),
      avatar: 'assets/logo/Profile.png',
      status: 'offline',
    };
  }

  // Falls back from OAuth metadata to the email prefix
  // when Google does not provide a display name.
  private getGoogleUserName(user: User): string {
    return (
      user.user_metadata?.['full_name'] ??
      user.user_metadata?.['name'] ??
      user.email?.split('@')[0] ??
      'User'
    );
  }

  async signInWithGoogle(): Promise<void> {
    const { error } =
      await this.supabase.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${this.getAppBaseUrl()}/auth/callback`,
        },
      });
    if (error) throw error;
  }

  // Keeps registration data temporarily between the
  // sign-up and avatar-selection steps.
  setRegisterData(data: RegisterData): void {
    this.registerData = data;
  }

  getRegisterData(): RegisterData | undefined {
    return this.registerData;
  }

  setAvatar(avatar: string): void {
    if (!this.registerData) return;
    this.registerData.avatar = avatar;
  }

  clearRegisterData(): void {
    this.registerData = undefined;
  }

  async loadCurrentUser(): Promise<void> {
    const { data, error } =
      await this.supabase.supabase.auth.getUser();

    if (error || !data.user) {
      this.clearCurrentSession();
      return;
    }
    await this.loadUserSession(data.user);
  }

  private async loadUserSession(user: User): Promise<void> {
    this.currentUser.set(user);
    const profile = await this.getProfile(user.id);
    this.currentUserProfile.set(profile);
  }

  private async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async signUp() {
    const registerData = this.requireRegisterData();
    const { email, password } = registerData;
    const { data, error } =
      await this.supabase.supabase.auth.signUp({ email, password });

    if (error) throw error;
    await this.finishSignUp(data.user, registerData);
    return data;
  }

  private async finishSignUp(user: User | null,registerData: RegisterData): Promise<void> {
    if (!user) {
      this.clearRegisterData();
      throw new Error('User data is missing after sign up.');
    }
    await this.createRegisteredProfile(user.id, registerData);
    this.clearRegisterData();
  }

  private async createRegisteredProfile(userId: string, data: RegisterData): 
  Promise<void> {
    const { error } = await this.supabase.supabase
      .from('profiles')
      .insert(this.buildRegisteredProfile(userId, data));
    if (error) throw error;
  }

  private buildRegisteredProfile(userId: string, data: RegisterData) {
    return {
      id: userId,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
      status: 'offline',
    };
  }

  private requireRegisterData(): RegisterData {
    if (!this.registerData) {
      throw new Error('Register data is not set.');
    }
    return this.registerData;
  }

  async login(email: string, password: string) {
    this.clearCurrentSession();
    const { data, error } = await this.supabase.supabase.auth.signInWithPassword({
        email, password,
      });

    if (error) throw error;
    await this.initializeLoggedInUser();
    return data;
  }

  // Reloads the profile after setting the online status
  // so the local session reflects the persisted profile state.
  private async initializeLoggedInUser(): Promise<void> {
    await this.loadCurrentUser();
    await this.updateStatus('online');
    await this.loadCurrentUser();
  }

  async logout(): Promise<void> {
    await this.updateStatus('offline');
    const { error } = await this.supabase.supabase.auth.signOut();
    if (error) throw error;
    this.clearCurrentSession();
  }

  private clearCurrentSession(): void {
    this.currentUser.set(null);
    this.currentUserProfile.set(null);
  }

  async resetPassword(email: string) {
    const { data, error } =
     await this.supabase.supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${this.getAppBaseUrl()}/reset-password`,
      });

    if (error) throw error;
    return data;
  }

  private getAppBaseUrl(): string {
  return window.location.hostname === 'localhost'
    ? 'http://localhost:4200'
    : 'https://serhat-oezcakir.de/DA-Bubble';
}

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) throw error;
    return data;
  }

  async updateProfileName(name: string) {
    const user = this.getEditableCurrentUser();
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    this.currentUserProfile.set(data);
    return data;
  }

  // Guest accounts are temporary and therefore cannot
  // modify persistent profile information.
  private getEditableCurrentUser(): User {
    if (this.isGuestUser()) {
      throw new Error('Gastbenutzer können ihr Profil nicht bearbeiten.');
    }

    const user = this.currentUser();
    if (!user) throw new Error('No user is currently logged in.');
    return user;
  }

  async updateStatus(status: 'online' | 'offline') {
    const user = this.currentUser();
    if (!user) return;

    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .update({ status })
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    this.currentUserProfile.set(data);
    return data;
  }

  async updateCurrentUserAvatar(avatar: string): Promise<void> {
    const user = await this.getAuthenticatedUser('No authenticated user found.');
    const profile = await this.updateUserAvatar(user.id, avatar);
    this.setCurrentSession(user, profile);
  }

  private async updateUserAvatar(userId: string, avatar: string): Promise<Profile> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .update({ avatar, status: 'online' })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Creates an isolated anonymous user with its own profile
  // and grants access only through the guest onboarding flow.
  async guestLogin(): Promise<void> {
    this.clearCurrentSession();
    const guestUser = await this.signInGuest();
    const guestProfile = await this.createGuestProfile(guestUser);

    await this.addGuestToWelcomeChannel(guestUser.id);
    this.setCurrentSession(guestUser, guestProfile);
    await this.loadCurrentUser();
    this.ensureGuestProfileLoaded();
  }

  private async signInGuest(): Promise<User> {
    const { data, error } = await this.supabase.supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) {throw new Error('Gastbenutzer konnte nicht erstellt werden.');}
    return data.user;
  }

  private async createGuestProfile(user: User): Promise<Profile> {
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .insert(this.buildGuestProfile(user))
      .select()
      .single();

    if (error) await this.handleGuestProfileError(error);
    return data;
  }
  
  // Builds a friendly temporary identity for anonymous users
  // using a short guest name and a random local avatar.
  private buildGuestProfile(user: User) {
    return {
      id: user.id,
      email: null,
      name: `Gast ${user.id.slice(-4)}`,
      avatar: this.getRandomGuestAvatar(),
      status: 'online',
      is_guest: true,
    };
  }

  // Gives each temporary guest identity a random avatar
  // from the predefined local avatar collection.
  private getRandomGuestAvatar(): string {
    const index = Math.floor(Math.random() * GUEST_AVATARS.length);
    return GUEST_AVATARS[index];
  }

  // Roll back anonymous authentication when profile creation
  // fails to avoid leaving an incomplete guest session.
  private async handleGuestProfileError(error: unknown): Promise<never> {
    await this.supabase.supabase.auth.signOut();
    throw error;
  }

  private ensureGuestProfileLoaded(): void {
    if (!this.currentUserProfile()) {
      throw new Error('Das Gastprofil konnte nicht geladen werden.');
    }
  }

  // Every guest joins the welcome channel automatically
  // so the demo has usable content immediately after login.
  private async addGuestToWelcomeChannel(guestUserId: string): Promise<void> {
    const channelId = await this.getWelcomeChannelId();
    await this.createGuestMembership(channelId, guestUserId);
  }

  private async getWelcomeChannelId(): Promise<string> {
    const { data, error } = await this.supabase.supabase
      .from('channels')
      .select('id')
      .eq('name', 'Willkommen')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('Der Channel "Willkommen" wurde nicht gefunden.');
    }
    return data.id;
  }

  private async createGuestMembership(channelId: string, guestUserId: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('channel_members')
      .insert({channel_id: channelId, profile_id: guestUserId,role: 'member'});
    if (error) this.throwMembershipError(error);
  }

  private throwMembershipError(error: unknown): never {
    console.error('Fehler beim Hinzufügen zum Willkommen-Channel:', error);
    throw error;
  }

  private async getAuthenticatedUser(missingUserMessage: string): Promise<User> {
    const { data, error } = await this.supabase.supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error(missingUserMessage);
    return data.user;
  }

  private setCurrentSession(user: User, profile: Profile): void {
    this.currentUser.set(user);
    this.currentUserProfile.set(profile);
  }

  isGuestUser(): boolean {
    return this.currentUserProfile()?.is_guest === true;
  }
}