import {
  Component,
  HostListener,
  inject,
  signal
} from '@angular/core';

import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { ChatArea } from '../chat-area/chat-area';
import { ThreadPanel } from '../thread-panel/thread-panel';

import { Auth } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';
import { ChannelService } from '../../../core/services/channel.service';

import { ChannelCreateDialog } from '../dialogs/channel-create-dialog/channel-create-dialog';
import { AddMembersDialag } from '../../workspace/dialogs/add-members-dialag/add-members-dialag';
import { AddMembersList } from '../dialogs/add-members-list/add-members-list';
import { ChannelDetail } from '../dialogs/channel-detail/channel-detail';
import { ShowProfilDialog } from '../dialogs/show-profil-dialog/show-profil-dialog';


type MobileView = 'sidebar' | 'chat' | 'thread';


@Component({
  selector: 'app-workspace-layout',

  imports: [
    Header,
    Sidebar,
    ChatArea,
    ThreadPanel,
    ChannelCreateDialog,
    AddMembersDialag,
    AddMembersList,
    ChannelDetail,
    ShowProfilDialog
  ],

  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {

  private auth = inject(Auth);

  messageService = inject(MessageService);
  channelService = inject(ChannelService);

  isSidebarClosed = false;

  mobileView = signal<MobileView>('sidebar');

  showCreateChannelDialog = signal(false);
  showAddMemberDialog = signal(false);
  showMemberListDialog = signal(false);
  showChannelSettingsDialog = signal(false);
  showNewMessage = signal(false);
  showProfilDialog = signal(false);


  async ngOnInit(): Promise<void> {
    await this.auth.loadCurrentUser();
    await this.channelService.loadChannels();

    const channels = this.channelService.channels();

    if (channels.length > 0) {
      this.channelService.setCurrentChannel(channels[0]);
    }

    this.channelService.subscribeToCurrentChannelMembers();
  }


  get isThreadOpen(): boolean {
    return !!this.messageService.selectedThreadMessage();
  }


  toggleSidebar(): void {
    this.isSidebarClosed = !this.isSidebarClosed;
  }


  onChatSelected(): void {
    this.closeNewMessage();
    this.mobileView.set('chat');
  }


  showMobileSidebar(): void {
    this.mobileView.set('sidebar');
  }


  showMobileChat(): void {
    this.mobileView.set('chat');
  }


  showMobileThread(): void {
    this.mobileView.set('thread');
  }


  openCreateChannelDialog(): void {
    this.showCreateChannelDialog.set(true);
  }


  closeCreateChannelDialog(): void {
    this.showCreateChannelDialog.set(false);
  }


  openAddMembersDialog(): void {
    this.showAddMemberDialog.set(true);
  }


  closeAddMembersDialog(): void {
    this.showAddMemberDialog.set(false);
  }


  openMemberListDialog(): void {
    this.showMemberListDialog.set(true);
  }


  closeAddMemberList(): void {
    this.showMemberListDialog.set(false);
  }


  openAddMembersFromList(): void {
    this.showAddMemberDialog.set(true);
    this.showMemberListDialog.set(false);
  }


  openChannelSettingsDialog(): void {
    this.showChannelSettingsDialog.set(true);
  }


  closeChannelSettingsDialog(): void {
    this.showChannelSettingsDialog.set(false);
  }


  openNewMessage(): void {
    this.showNewMessage.set(true);
    this.mobileView.set('chat');
  }


  closeNewMessage(): void {
    this.showNewMessage.set(false);
  }


  openShowProfilDialog(): void {
    this.showProfilDialog.set(true);
  }


  closeShowProfilDialog(): void {
    this.showProfilDialog.set(false);
  }


  @HostListener('document:keydown.esc')
  closeEscShowDialog(): void {
    this.showProfilDialog.set(false);
  }
}