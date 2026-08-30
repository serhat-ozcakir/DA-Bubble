import { Component, computed, inject, output } from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { UserService } from '../../../../core/services/user.service';
import { Auth } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-chat-header',
  imports: [],
  templateUrl: './chat-header.html',
  styleUrl: './chat-header.scss',
})
export class ChatHeader {
  channelService = inject(ChannelService);
  directMessageService = inject(DirectMessageService);
  userService = inject(UserService);
  authService = inject(Auth);
  openAddMembers = output<void>();
  openMemberList = output<void>();
  openChannelSettings = output<void>();
  openShowProfil = output<void>();

  // Detects self-DMs so the header can adapt its UI
  // when the current user is also the conversation partner.
  isSelfDm = computed(() => {
    const dmUser = this.directMessageService.currentDmUser();
    const currentUser = this.authService.currentUserProfile();

    return !!dmUser &&
      !!currentUser &&
      dmUser.id === currentUser.id;
  });

  openMemberListDialog(): void {
    this.openMemberList.emit();
  }

  // Opens the member list on mobile, while desktop
  // uses the dedicated add-members dialog.
  openMembersMobile(): void {
    if (window.matchMedia('(max-width:1024px)').matches) {
      this.openMemberList.emit();
      return;
    }

    this.openAddMembers.emit();
  }

  openChannelSettingsDialog(): void {
    this.openChannelSettings.emit();
  }

  openShowProfilDialog(): void {
    this.openShowProfil.emit();
  }
}