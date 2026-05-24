import { Injectable } from '@angular/core';
import { Supabase } from '../supabase/supabase.service';

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

  async signUp() {
    if (!this.RegisterData) {
      throw new Error('Register data is not set.');
    }
    const { email, password } = this.RegisterData;
    const { data, error } = await this.supabase.supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      throw error;
    }
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
    return data;
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
}