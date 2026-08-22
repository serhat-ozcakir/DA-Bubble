import { HostListener, Component, output, Host, signal, input } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';

@Component({
  selector: 'app-channel-create-dialog',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './channel-create-dialog.html',
  styleUrl: './channel-create-dialog.scss',
})
export class ChannelCreateDialog {
  closeDialog = output<void>();
  channelForm = new FormGroup({
    channelName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    channelDescription: new FormControl('', [Validators.maxLength(200)]),
  });
  isLoading = signal(false);
  errorMessage = signal('');
  SidebarClosed = input<boolean>(false);
  mobileFullPage = input<boolean>(false);

  constructor(private channelService: ChannelService) { }

  close(): void {
    this.closeDialog.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  async createChannel(): Promise<void> {
    if (this.channelForm.invalid) {
      this.channelForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { channelName, channelDescription } = this.channelForm.getRawValue();

    try {
      await this.channelService.createChannel(
        channelName?.trim() ?? '',
        channelDescription?.trim() ?? ''
      );

      this.close();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'CHANNEL_ALREADY_EXISTS'
      ) {
        this.errorMessage.set('Dieser Channel existiert bereits.');
      } else {
        this.errorMessage.set('Channel konnte nicht erstellt werden.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

}
