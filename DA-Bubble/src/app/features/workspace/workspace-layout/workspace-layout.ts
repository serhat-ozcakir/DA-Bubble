import { Component, inject, signal } from '@angular/core';
import { Header } from '../header/header';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { ChatArea } from '../chat-area/chat-area';
import { ThreadPanel } from '../thread-panel/thread-panel';
import { Auth } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';
import {ChannelCreateDialog} from "../dialogs/channel-create-dialog/channel-create-dialog";
import {AddMembersDialag} from "../../workspace/dialogs/add-members-dialag/add-members-dialag";


@Component({
  selector: 'app-workspace-layout',
  imports: [Header, Sidebar, ChatArea,ThreadPanel, ChannelCreateDialog, AddMembersDialag],
  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {

  isSidebarClosed = false;
  messageService = inject(MessageService);
  showCreateChannelDialog = signal(false);
  showAddMemberDialog = signal(false);


  constructor(private auth: Auth) {  }

  async ngOnInit() {
    await this.auth.loadCurrentUser();
  }

  toggleSidebar(): void {
    this.isSidebarClosed = !this.isSidebarClosed;
  }

  get isThreadOpen():boolean{
    return !!this.messageService.selectedThreadMessage()
  }

  openCreateChannelDialog():void{
    this.showCreateChannelDialog.set(true)
  }

  closeCreateChannelDialog():void{
    this.showCreateChannelDialog.set(false);
  } 

  openAddMembersDialog():void{
    this.showAddMemberDialog.set(true);
  }
  closeAddMembersDialog():void{
    console.log('calisti');
    this.showAddMemberDialog.set(false);
  }
}
