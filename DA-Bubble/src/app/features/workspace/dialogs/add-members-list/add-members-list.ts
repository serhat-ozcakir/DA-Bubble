import { Component, inject, input, output, signal } from '@angular/core';
import { ChannelService } from "../../../../core/services/channel.service";
import { Auth } from "../../../../core/services/auth.service";

@Component({
  selector: 'app-add-members-list',
  imports: [],
  templateUrl: './add-members-list.html',
  styleUrl: './add-members-list.scss',
})

export class AddMembersList {
  channelService = inject(ChannelService);
  authService = inject(Auth);
  isMembersDropdownOpen = signal(false);
  closeAddMemberList = output<void>();
  openAddMembers = output<void>();
  threadOpen = input<boolean>(false);

  toggleMembersDropdown(): void {
    this.isMembersDropdownOpen.update((value) => !value);
  }

}
