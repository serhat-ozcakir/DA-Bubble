import {Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';
import { UserService } from '../../../../core/services/user.service';
import { Profile } from '../../../../core/models/profile.model';

@Component({
  selector: 'app-add-members-dialag',
  imports: [],
  templateUrl: './add-members-dialag.html',
  styleUrl: './add-members-dialag.scss',
})

export class AddMembersDialag implements OnInit {
  closeAddMemberDialog = output<void>();
  channelService = inject(ChannelService);
  userService = inject(UserService);
  searchText = signal('');
  selectedUsers = signal<Profile[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  threadOpen = input<boolean>(false);
  mobileBottomSheet = input<boolean>(false);
  users = this.userService.user;

  // Shows only matching users who are neither already selected
  // nor already members of the current channel.
  filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase().trim();

    if (!search) return [];

    return this.users().filter((user) =>
      this.userMatchesSearch(user, search)
    );
  });

  async ngOnInit(): Promise<void> {
    await this.userService.loadUsers();
  }

  close(): void {
    this.closeAddMemberDialog.emit();
  }

  // Prevents duplicate selections before adding users
  // to the channel in a single batch.
  selectUser(user: Profile): void {
    if (this.isUserSelected(user.id)) {
      this.errorMessage.set('User is already selected.');
      return;
    }
    this.selectedUsers.update((users) => [...users, user]);
    this.searchText.set('');
  }

  clearSelectedUser(): void {
    this.selectedUsers.set([]);
    this.searchText.set('');
    this.errorMessage.set('');
  }

  removeSelectedUser(userId: string): void {
    this.selectedUsers.update((users) =>
      users.filter((user) => user.id !== userId)
    );
  }

  // Adds all selected users to the active channel
  // and closes the dialog only after a successful request.
  async addMembers(): Promise<void> {
    const channel = this.channelService.currentChannel();
    const selectedUsers = this.selectedUsers();

    if (!channel || selectedUsers.length === 0) return;
    this.startLoading();
    try {
      await this.addSelectedMembers(channel.id, selectedUsers);
      this.close();
    } catch {
      this.setAddMembersError();
    } finally {
      this.isLoading.set(false);
    }
  }

  // Excludes users who are already selected or already
  // belong to the current channel from search results.
  private userMatchesSearch(user: Profile, search: string): boolean {
    return (
      user.name.toLowerCase().includes(search) &&
      !this.isUserSelected(user.id) &&
      !this.isChannelMember(user.id)
    );
  }

  private isUserSelected(userId: string): boolean {
    return this.selectedUsers()
      .some((user) => user.id === userId);
  }

  private isChannelMember(userId: string): boolean {
    return this.channelService.channelMembers()
      .some((member) => member.id === userId);
  }

  private startLoading(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  private async addSelectedMembers(channelId: string, users: Profile[]): Promise<void> {
    const userIds = users.map((user) => user.id);
    await this.channelService.addMembersToChannel(channelId, userIds);
  }

  private setAddMembersError(): void {
    this.errorMessage.set('Benutzer konnten nicht hinzugefügt werden.');
  }
}