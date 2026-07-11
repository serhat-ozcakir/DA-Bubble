import { Component, inject, output } from '@angular/core';
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
  constructor() {
  }

  openDialog(): void {
    this.openAddMembers.emit();
  }

  openMemberListDialog(): void {
    this.openMemberList.emit();
  }

  openChannelSettingsDialog(): void {
    console.log('openChannelSettingDialog calisti');
    this.openChannelSettings.emit();
  }

}