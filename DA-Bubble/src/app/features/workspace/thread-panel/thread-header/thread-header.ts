import { Component, inject } from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-thread-header',
  imports: [],
  templateUrl: './thread-header.html',
  styleUrl: './thread-header.scss',
})
export class ThreadHeader {
  channelService = inject(ChannelService)
  messageService = inject(MessageService)
}
