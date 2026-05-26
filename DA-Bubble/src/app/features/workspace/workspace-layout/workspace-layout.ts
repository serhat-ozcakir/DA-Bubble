import { Component } from '@angular/core';
import { Header } from '../header/header';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { ChatArea } from '../chat-area/chat-area';
import { ThreadPanel } from '../thread-panel/thread-panel';
import { Auth } from '../../../core/services/auth.service';


@Component({
  selector: 'app-workspace-layout',
  imports: [Header, RouterOutlet, Sidebar, ChatArea,ThreadPanel],
  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {

  constructor(private auth: Auth) {

  }

  async ngOnInit() {
    await this.auth.loadCurrentUser();
  }
}
