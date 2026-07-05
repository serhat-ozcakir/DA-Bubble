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
  selectedUser = signal<Profile | null>(null);
  users = this.userService.user;
  isLoading = signal(false);
  errorMessage = signal('');

  filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    if (!search) {
      return [];
    }
    return this.users().filter(user => user.name.toLowerCase().includes(search.toLowerCase()));
  });

  async ngOnInit(): Promise<void> {
    await this.userService.loadUsers();
  }

  close(): void {
    this.closeAddMemberDialog.emit();
  }

  selectUser(user: Profile): void {
    this.selectedUser.set(user);
    this.searchText.set(user.name);
  }

  clearSelectedUser(): void {
    this.selectedUser.set(null);
    this.searchText.set('');
    this.errorMessage.set('');
  }

  async addMember(): Promise<void> {
    const selectedUser = this.selectedUser();
    const currentChannel = this.channelService.currentChannel();

    if (!selectedUser || !currentChannel) {
      this.errorMessage.set('Please select a user and a channel.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.channelService.addMemberToChannel(currentChannel.id, selectedUser.id);
      this.close();
    } catch (error) {
      console.error('Error adding member to channel:', error);
      this.errorMessage.set('Failed to add member to channel. Please try again.');
    } finally {
      this.isLoading.set(false);
    }

  }
}
