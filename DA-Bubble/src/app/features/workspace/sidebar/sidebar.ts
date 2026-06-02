import { Component } from '@angular/core';
import {Auth} from "../../../core/services/auth.service";

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isChannelsOpen = true;
  isDirectMessagesOpen = true;

 constructor(public auth: Auth) {
 }

 users = [
  {
    id: 1,
    name: 'Frederik Beck (Du)',
    avatar: 'assets/img/avatar/avatar-1.png',
    status: 'online',
  },
  {
    id: 2,
    name: 'Sofia Müller',
    avatar: 'assets/img/avatar/avatar-2.png',
    status: 'online',
  },
  {
    id: 3,
    name: 'Noah Braun',
    avatar: 'assets/img/avatar/avatar-3.png',
    status: 'offline',
  },
];

  toggleSection(section: 'channels' | 'directMessages'): void {
    if (section === 'channels') {
      this.isChannelsOpen = !this.isChannelsOpen;
    } else if (section === 'directMessages') {
      this.isDirectMessagesOpen = !this.isDirectMessagesOpen;
    }
  }
}
