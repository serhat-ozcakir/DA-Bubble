import { Component, effect, inject } from '@angular/core';
import {  MessageItemComponent } from '../message-item/message-item';
import { MessageView } from '../../../../core/models/message-view.model';
import { MessageService } from '../../../../core/services/message.service';
import { Auth } from '../../../../core/services/auth.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { DirectMessageService } from '../../../../core/services/direct-message.service';
import { ReactionService } from '../../../../core/services/reaction.service'; 

@Component({
  selector: 'app-message-list',
  imports: [MessageItemComponent],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
})
export class MessageList {
  
  messageService = inject(MessageService);
  private authService = inject(Auth);
  private channelService = inject(ChannelService);
  directMessageService = inject(DirectMessageService);
  private reactionService = inject(ReactionService);

constructor() {
  effect(() => {
    const dmUser = this.directMessageService.currentDmUser();
    const channel = this.channelService.currentChannel();
    this.reactionService.loadReactions();

    if (dmUser) {
      this.directMessageService.loadDirectMessages();
      this.directMessageService.listenToDirectMessages();
      return;
    }

    if (channel) {
      this.directMessageService.removeDmRealtimeChannel();
      this.messageService.loadMessages();
      this.messageService.listenToMessages();
    }
  });
}

  async ngOnInit(): Promise<void> {
    await this.authService.loadCurrentUser(); 
  }

}