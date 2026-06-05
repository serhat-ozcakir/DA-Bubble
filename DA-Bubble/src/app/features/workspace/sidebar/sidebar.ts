import { Component, inject, OnInit } from '@angular/core';
import {Auth} from "../../../core/services/auth.service";
import { ChannelService } from '../../../core/services/channel.service';
import {UserService} from "../../../core/services/user.service";


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

  isChannelsOpen = true;
  isDirectMessagesOpen = true;

 constructor() {
 }

 async ngOnInit(): Promise<void> {
   await this.userService.loadUsers();
   await this.channelService.loadChannels();
  }


  toggleSection(section: 'channels' | 'directMessages'): void {
    if (section === 'channels') {
      this.isChannelsOpen = !this.isChannelsOpen;
    } else if (section === 'directMessages') {
      this.isDirectMessagesOpen = !this.isDirectMessagesOpen;
    }
  }
}
