import { Component, inject } from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';

@Component({
  selector: 'app-chat-header',
  imports: [],
  templateUrl: './chat-header.html',
  styleUrl: './chat-header.scss',
})
export class ChatHeader {
  channelService = inject(ChannelService);
  
  constructor() {
}
}