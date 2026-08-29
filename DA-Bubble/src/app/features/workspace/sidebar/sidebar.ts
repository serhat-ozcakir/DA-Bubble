import { Component, inject, OnInit, output } from '@angular/core';
import { Auth } from "../../../core/services/auth.service";
import { ChannelService } from '../../../core/services/channel.service';
import { UserService } from "../../../core/services/user.service";
import { MessageService } from '../../../core/services/message.service';
import { Channel } from '../../../core/models/channel.model';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { Profile } from '../../../core/models/profile.model';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {

  channelService = inject(ChannelService);
  userService = inject(UserService);
  authService = inject(Auth);
  messageService = inject(MessageService);
  direktMessageService = inject(DirectMessageService);
  openNewMessage = output<void>();
  chatSelected = output<void>();
  isChannelsOpen = true;
  isDirectMessagesOpen = true;
  openCreateChannel = output<void>();

  async ngOnInit(): Promise<void> {
    await this.userService.loadUsers();
  }

  selectChannel(channel: Channel): void {
    this.channelService.setCurrentChannel(channel);
    this.direktMessageService.currentDmUser.set(null)
    this.messageService.closeThread();
    this.chatSelected.emit();
  }

  toggleSection(section: 'channels' | 'directMessages'): void {
    if (section === 'channels') {
      this.isChannelsOpen = !this.isChannelsOpen;
    } else if (section === 'directMessages') {
      this.isDirectMessagesOpen = !this.isDirectMessagesOpen;
    }
  }

  async selectDmUser(user: Profile): Promise<void> {
    this.channelService.currentChannel.set(null);
    this.direktMessageService.currentDmUser.set(user);
    this.messageService.closeThread();
    await this.direktMessageService.loadDirectMessages();
    this.chatSelected.emit();
  }

  openDialog(): void {
    console.log('openDialog calisti');
    this.openCreateChannel.emit()
  }

  openNewMessageView(): void {
    this.messageService.closeThread();
    this.channelService.currentChannel.set(null);
    this.direktMessageService.currentDmUser.set(null);
    this.openNewMessage.emit();
  }
}
