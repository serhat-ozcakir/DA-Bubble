import { Component, inject, signal } from '@angular/core';
import { Header } from '../header/header';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { ChatArea } from '../chat-area/chat-area';
import { ThreadPanel } from '../thread-panel/thread-panel';
import { Auth } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';
import { ChannelCreateDialog } from "../dialogs/channel-create-dialog/channel-create-dialog";
import { AddMembersDialag } from "../../workspace/dialogs/add-members-dialag/add-members-dialag";
import { ChannelService } from '../../../core/services/channel.service';
import { AddMembersList } from '../dialogs/add-members-list/add-members-list';
import { ChannelDetail } from "../dialogs/channel-detail/channel-detail";


@Component({
  selector: 'app-workspace-layout',
  imports: [Header, Sidebar, ChatArea, ThreadPanel, ChannelCreateDialog, AddMembersDialag, AddMembersList, ChannelDetail],
  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {

  isSidebarClosed = false;
  messageService = inject(MessageService);
  showCreateChannelDialog = signal(false);
  showAddMemberDialog = signal(false);
  showMemberListDialog = signal(false);
  showChannelSettingsDialog = signal(false);
  channelService = inject(ChannelService);


  constructor(private auth: Auth) { }

  async ngOnInit() {
    await this.auth.loadCurrentUser();
    await this.channelService.loadChannels();
    this.channelService.subscribeToChannelMemberships();
  }

  toggleSidebar(): void {
    this.isSidebarClosed = !this.isSidebarClosed;
  }

  get isThreadOpen(): boolean {
    return !!this.messageService.selectedThreadMessage()
  }

  openCreateChannelDialog(): void {
    this.showCreateChannelDialog.set(true)
  }

  closeCreateChannelDialog(): void {
    this.showCreateChannelDialog.set(false);
  }

  openAddMembersDialog(): void {
    this.showAddMemberDialog.set(true);
  }
  closeAddMembersDialog(): void {
    console.log('calisti');
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
}