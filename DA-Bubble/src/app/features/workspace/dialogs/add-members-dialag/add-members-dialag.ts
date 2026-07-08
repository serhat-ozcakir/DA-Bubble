import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelService } from "../../../../core/services/channel.service";
import { UserService } from "../../../../core/services/user.service";
import { Profile } from '../../../../core/models/profile.model';

@Component({
  selector: 'app-add-members-dialag',
  imports: [],
  templateUrl: './add-members-dialag.html',
  styleUrl: './add-members-dialag.scss',
})
export class AddMembersDialag {
  closeAddMemberDialog = output<void>();
  channelService = inject(ChannelService);
  userService = inject(UserService);
  searchText = signal('');
  selectedUsers = signal<Profile[]>([]);
  users = this.userService.user;
  isLoading = signal(false);
  errorMessage = signal('');

  filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    if (!search) {
      return [];
    }

    const selectedUserIds = this.selectedUsers().map(user => user.id);
    const channelMembers = this.channelService.channelMembers().map(member => member.id);
    
    return this.users().filter(user => user.name.toLowerCase()
    .includes(search.toLowerCase()) && !selectedUserIds.includes(user.id) && !channelMembers.includes(user.id));
  });

  async ngOnInit(): Promise<void> {
    await this.userService.loadUsers();
  }

  close(): void {
    this.closeAddMemberDialog.emit();
  }

  selectUser(user: Profile): void {
    const alreadySelected = this.selectedUsers()?.some(selected => selected.id === user.id);
    if (alreadySelected) {
      this.errorMessage.set('User is already selected.');
      return;
    }
    this.selectedUsers.update((users)=> [...users, user]);
    this.searchText.set('');
  }

  clearSelectedUser(): void {
    this.selectedUsers.set([]);
    this.searchText.set('');
    this.errorMessage.set('');
  }

  removeSelectedUser(userId: string): void {
    this.selectedUsers.update((users) => users.filter(selected => selected.id !== userId));
  }

async addMembers(): Promise<void> {
  const currentChannel = this.channelService.currentChannel();
  const selectedUsers = this.selectedUsers();

  if (!currentChannel || selectedUsers.length === 0) {
    return;
  }

  this.isLoading.set(true);
  this.errorMessage.set('');

  try {
    await this.channelService.addMembersToChannel(
      currentChannel.id,
      selectedUsers.map((user) => user.id)
    );

    this.close();
  } catch (error) {
    this.errorMessage.set('Benutzer konnten nicht hinzugefügt werden.');
  } finally {
    this.isLoading.set(false);
  }
}
}
