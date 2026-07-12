import { Component, inject, output, signal } from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';

@Component({
  selector: 'app-channel-detail',
  imports: [],
  templateUrl: './channel-detail.html',
  styleUrl: './channel-detail.scss',
})
export class ChannelDetail {
  closeChannelSettings = output<void>();
  channelService = inject(ChannelService);
  isLeaving = signal(false);
  leaveErrorMessage = signal('');

  close(): void {
    this.closeChannelSettings.emit();
  }

  async leaveChannel(): Promise<void> {
    const currentChannel = this.channelService.currentChannel();

    if (!currentChannel) {
      return;
    }

    try {
      await this.channelService.leaveChannel(currentChannel.id);
      this.close();
    } catch (error) {
      console.log('Unable to leave the channel:', error);
      this.leaveErrorMessage.set('Unable to leave the channel')
    } finally {
      this.isLeaving.set(false)
    }
  }
}
