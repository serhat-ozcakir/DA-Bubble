import {Component, HostListener, input, output, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';

@Component({
  selector: 'app-channel-create-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './channel-create-dialog.html',
  styleUrl: './channel-create-dialog.scss',
})

export class ChannelCreateDialog {
  private channelService: ChannelService;
  closeDialog = output<void>();
  isLoading = signal(false);
  errorMessage = signal('');
  SidebarClosed = input<boolean>(false);
  mobileFullPage = input<boolean>(false);

  channelForm = new FormGroup({
    channelName: new FormControl('', [
      Validators.required,
      Validators.maxLength(50),
    ]),
    channelDescription: new FormControl('', [
      Validators.maxLength(200),
    ]),
  });

  constructor(channelService: ChannelService) {
    this.channelService = channelService;
  }

  close(): void {
    this.closeDialog.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  // Keeps the dialog open on validation or request errors
  // and closes it only after successful channel creation.
  async createChannel(): Promise<void> {
    if (this.channelForm.invalid) {
      this.markFormAsInvalid();
      return;
    }
    this.startLoading();
    try {
      await this.createChannelFromForm();
      this.close();
    } catch (error) {
      this.handleCreateError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private markFormAsInvalid(): void {
    this.channelForm.markAllAsTouched();
  }

  private startLoading(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  // Normalizes form values before passing them
  // to the channel creation service.
  private async createChannelFromForm(): Promise<void> {
    const { channelName, channelDescription } = this.channelForm.getRawValue();

    await this.channelService.createChannel(
      channelName?.trim() ?? '',
      channelDescription?.trim() ?? ''
    );
  }
  
  // Maps the known duplicate-channel error to a specific
  // user message while keeping a fallback for other failures.
  private handleCreateError(error: unknown): void {
    const message = this.isDuplicateChannelError(error)
      ? 'Dieser Channel existiert bereits.'
      : 'Channel konnte nicht erstellt werden.';

    this.errorMessage.set(message);
  }

  private isDuplicateChannelError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message === 'CHANNEL_ALREADY_EXISTS'
    );
  }
}