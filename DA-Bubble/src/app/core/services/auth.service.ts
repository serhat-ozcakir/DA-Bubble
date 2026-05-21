import { Injectable } from '@angular/core';

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
  private  RegisterData?: RegisterData;

  setRegisterData(data: RegisterData) {
    this.RegisterData = data;
  }

  getRegisterData(): RegisterData | undefined {
    return this.RegisterData;
  }

  setAvatar(avatar: string) {
    if (!this.RegisterData) return;
    this.RegisterData.avatar = avatar;
  }
  clearRegisterData() {
    this.RegisterData = undefined;
  }
}
