import { Component, inject, output } from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';

@Component({
  selector: 'app-channel-detail',
  imports: [],
  templateUrl: './channel-detail.html',
  styleUrl: './channel-detail.scss',
})
export class ChannelDetail {
   closeChannelSettings = output<void>();
   channelService = inject(ChannelService)

   close(): void {
    this.closeChannelSettings.emit();
  }
}
