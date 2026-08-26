import { Component, computed, effect, Host, HostListener, inject, signal } from '@angular/core';
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
import { UserService } from '../../../core/services/user.service';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { Profile } from '../../../core/models/profile.model';
import { Channel } from '../../../core/models/channel.model';

type MobileView = 'sidebar' | 'chat' | 'thread' | 'search' | 'create-channel' | 'channel-detail';

@Component({
  selector: 'app-workspace-layout',

  imports: [Header, Sidebar, ChatArea, ThreadPanel, ChannelCreateDialog,
    AddMembersDialag, AddMembersList, ChannelDetail, ShowProfilDialog],

  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {

  auth = inject(Auth);
  userService = inject(UserService);
  directMessageService = inject(DirectMessageService);
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
  mobileSearchText = signal('');
  addMembersAsBottomSheet = signal(false);

  constructor() {
    effect(() => {
      const threadOpen = !!this.messageService.selectedThreadMessage()
      if (threadOpen) {
        this.mobileView.set('thread');
        return;
      }
      if (this.mobileView() === 'thread') {
        this.mobileView.set('chat')
      }
    })
  }


  async ngOnInit(): Promise<void> {
    await this.auth.loadCurrentUser();
    await this.channelService.loadChannels();

    const channels = this.channelService.channels();

    if (channels.length > 0) {
      this.channelService.setCurrentChannel(channels[0]);
    }

    this.channelService.subscribeToCurrentChannelMembers();
  }

  @HostListener('window:resize')
  onResize(): void {
    const isMobile = window.matchMedia('(max-width:1024px)').matches;
    if (isMobile) {
      this.closeDesktopDialogs();
      this.mobileView.set('sidebar');
      this.isSidebarClosed = false
      return;
    }
    this.closeMobileViews();
  }

  private closeDesktopDialogs(): void {
    this.showChannelSettingsDialog.set(false);
    this.showCreateChannelDialog.set(false);
    this.showMemberListDialog.set(false);

  }

  private closeMobileViews(): void {
    if (this.mobileView() === 'channel-detail' || 'create-channel') {
      this.mobileView.set('sidebar')
    }
    this.showAddMemberDialog.set(false);
    this.addMembersAsBottomSheet.set(false);
    this.showMemberListDialog.set(false);
  }

  mobileSearchMode = computed<'users' | 'channels'>(() => {
    const search = this.mobileSearchText().trim();

    if (!search) {
      return 'users';
    }

    if (search.startsWith('#')) {
      return 'channels';
    }
    return 'users';
  });

  filteredMobileUsers = computed(() => {
    const search = this.mobileSearchText().toLowerCase().trim();
    if (search.startsWith('#')) {
      return [];
    }

    const userSearch = search.startsWith('@') ? search.slice(1).trim() : search;

    if (!userSearch) {
      return this.userService.user();
    }
    return this.userService.user().filter((user) =>
      user.name.toLowerCase().includes(userSearch)
    );
  })

  filteredMobileChannels = computed(() => {
    const search = this.mobileSearchText().toLowerCase().trim();

    if (!search.startsWith('#')) {
      return [];
    }
    const channelSearch = search.slice(1).trim();
    if (!channelSearch) {
      return this.channelService.channels()
    }

    return this.channelService.channels().filter((channel) => {
      channel.name.toLowerCase().includes(channelSearch)
    })
  })

  onMobileSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.mobileSearchText.set(input.value);
  }

  async selectMobileUser(user: Profile): Promise<void> {
    await this.directMessageService.selectDmUser(user);
    this.mobileSearchText.set('');
    this.mobileView.set('chat');
  }

  selectMobileChannel(channel: Channel): void {
    this.directMessageService.currentDmUser.set(null);
    this.channelService.setCurrentChannel(channel);
    this.mobileSearchText.set('');
    this.mobileView.set('chat');
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
    this.messageService.selectedThreadMessage.set(null);
    this.mobileView.set('sidebar');
  }

  showMobileChat(): void {
    this.mobileView.set('chat');
  }

  showMobileThread(): void {
    this.mobileView.set('thread');
  }

  openMobileSearch(): void {
    this.mobileView.set('search');
  }

  openMobileNewMessage(): void {
    this.showNewMessage.set(true);
    this.mobileView.set('chat');
  }

  closeMobileSearch(): void {
    this.mobileSearchText.set('');
    this.mobileView.set('sidebar');
  }

  openCreateChannelDialog(): void {
    if (window.matchMedia('(max-width:1024px)').matches) {
      this.mobileView.set('create-channel');
      return;
    }
    this.showCreateChannelDialog.set(true);
  }
  closeMobileCreateChannel(): void {
    this.mobileView.set('sidebar')
  }

  closeCreateChannelDialog(): void {
    this.showCreateChannelDialog.set(false);
  }

  openAddMembersDialog(): void {
    this.addMembersAsBottomSheet.set(false);
    this.showAddMemberDialog.set(true);
  }

  closeAddMembersDialog(): void {
    this.showAddMemberDialog.set(false);
    this.addMembersAsBottomSheet.set(false);
  }

  openMemberListDialog(): void {
    this.showMemberListDialog.set(true);
  }

  closeAddMemberList(): void {
    this.showMemberListDialog.set(false);
  }

  openAddMembersFromList(): void {
    this.addMembersAsBottomSheet.set(false);
    this.showAddMemberDialog.set(true);
    this.showMemberListDialog.set(false);
  }

  openChannelSettingsDialog(): void {
    if (window.matchMedia('(max-width:1024px)').matches) {
      this.mobileView.set('channel-detail');
      return;
    }
    this.showChannelSettingsDialog.set(true);
  }

  openAddMembersFromChannelDetail(): void {
    this.addMembersAsBottomSheet.set(true);
    this.showAddMemberDialog.set(true);
  }

  closeChannelSettingsDialog(): void {
    this.showChannelSettingsDialog.set(false);
  }

  closeMobileChannelSettings(): void {
    this.mobileView.set('chat');
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