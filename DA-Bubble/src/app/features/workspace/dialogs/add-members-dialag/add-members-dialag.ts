import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ChannelService} from "../../../../core/services/channel.service";
import {UserService} from "../../../../core/services/user.service";
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

filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase().trim();
  if(!search) {
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

  clearSelectedUser():void {
    this.selectedUser.set(null);
    this.searchText.set('');
  }
}
