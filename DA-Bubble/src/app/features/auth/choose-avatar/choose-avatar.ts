import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';


@Component({
  selector: 'app-choose-avatar',
  imports: [],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar {

  avatars = [
    'assets/img/avatar/avatar-1.png',
    'assets/img/avatar/avatar-2.png',
    'assets/img/avatar/avatar-3.png',
    'assets/img/avatar/avatar-4.png',
    'assets/img/avatar/avatar-5.png',
    'assets/img/avatar/avatar-6.png'
  ];

  selectedAvatar = 'assets/logo/Profile.png';
  userName = '';

 
  constructor(
    private authService: Auth,
    private router: Router
  ) {

    const registerData = this.authService.getRegisterData();

    if (registerData) {
      this.userName = registerData.name;
    }
  }

  goBack() {
    window.history.back();
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar; 
  }

  async onChooseAvatar(): Promise<void> {
    this.authService.setAvatar(this.selectedAvatar);

    try{
      const data = await this.authService.signUp();
      console.log('Supabase user:', data);
      this.authService.clearRegisterData();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error choosing avatar:', error);
    }

  }
}
