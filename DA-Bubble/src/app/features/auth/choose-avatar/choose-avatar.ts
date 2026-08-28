import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';

@Component({
  selector: 'app-choose-avatar',
  imports: [],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar implements OnInit {
  readonly avatars = [
    'assets/img/avatar/avatar-1.png',
    'assets/img/avatar/avatar-2.png',
    'assets/img/avatar/avatar-3.png',
    'assets/img/avatar/avatar-4.png',
    'assets/img/avatar/avatar-5.png',
    'assets/img/avatar/avatar-6.png',
  ];

  selectedAvatar = signal('assets/logo/Profile.png');
  userName = signal('');
  registrationType = signal<'email' | 'google' | null>(null);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const registerData = this.authService.getRegisterData();

    if (registerData) {
      this.prepareEmailRegistration(registerData.name);
      return;
    }

    await this.prepareGoogleRegistration();
  }

  private prepareEmailRegistration(name: string): void {
    this.registrationType.set('email');
    this.userName.set(name);
  }

  private async prepareGoogleRegistration(): Promise<void> {
    try {
      await this.authService.loadCurrentUser();
      await this.setGoogleRegistrationData();
    } catch (error) {
      await this.handleProfileLoadError(error);
    }
  }

  private async setGoogleRegistrationData(): Promise<void> {
    const profile = this.authService.currentUserProfile();

    if (!profile) {
      await this.router.navigate(['/login']);
      return;
    }

    this.registrationType.set('google');
    this.userName.set(profile.name);
  }

  private async handleProfileLoadError(error: unknown): Promise<void> {
    console.error('Error loading Google profile:', error);
    await this.router.navigate(['/login']);
  }

  goBack(): void {
    window.history.back();
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar.set(avatar);
    this.errorMessage.set('');
  }

  async onChooseAvatar(): Promise<void> {
    if (this.loading()) return;

    const registrationType = this.registrationType();
    if (!registrationType) {
      this.setRegistrationTypeError();
      return;
    }

    await this.completeRegistration(registrationType);
  }

  private setRegistrationTypeError(): void {
    this.errorMessage.set(
      'Die Registrierungsart konnte nicht ermittelt werden.'
    );
  }

  private async completeRegistration(registrationType: 'email' | 'google'):
   Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.runRegistrationFlow(registrationType);
    } catch (error) {
      this.handleAvatarError(error);
    } finally {
      this.loading.set(false);
    }
  }

  private async runRegistrationFlow(
    registrationType: 'email' | 'google'
  ): Promise<void> {
    if (registrationType === 'email') {
      await this.completeEmailRegistration();
      return;
    }

    await this.completeGoogleRegistration();
  }

  private handleAvatarError(error: unknown): void {
    console.error('Error choosing avatar:', error);
    this.errorMessage.set(
      'Der Avatar konnte nicht gespeichert werden.'
    );
  }

  private async completeEmailRegistration(): Promise<void> {
    this.authService.setAvatar(this.selectedAvatar());
    const data = await this.authService.signUp();

    console.log('Supabase user:', data);
    this.authService.clearRegisterData();
    await this.router.navigate(['/login']);
  }

  private async completeGoogleRegistration(): Promise<void> {
    await this.authService.updateCurrentUserAvatar(
      this.selectedAvatar()
    );
    await this.router.navigate(['/workspace']);
  }
}