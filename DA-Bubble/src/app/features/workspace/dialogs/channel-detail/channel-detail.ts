import { Component, inject, output, signal } from '@angular/core';
import { ChannelService } from '../../../../core/services/channel.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, } from '@angular/forms';

@Component({
  selector: 'app-channel-detail',
  imports: [ReactiveFormsModule],
  templateUrl: './channel-detail.html',
  styleUrl: './channel-detail.scss',
})
export class ChannelDetail {
  closeChannelSettings = output<void>();
  channelService = inject(ChannelService);
  isLeaving = signal(false);
  leaveErrorMessage = signal('');
  isEditingName = signal(false);
  isEditingDescriptionName = signal(false);
  nameErrorMessage = signal('');
  isSavingName = signal(false);
  isSavingDescription = signal(false);
  descriptionErrorMessage = signal('');

  channelEditForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.maxLength(200),
      ],
    }),
  });

  startEditingName(): void {
    const channel = this.channelService.currentChannel();

    if (!channel) return;
    this.channelEditForm.controls.name.setValue(channel.name);
    this.isEditingName.set(true)
  }

startEditingDescription(): void {
  const currentChannel = this.channelService.currentChannel();

  if (!currentChannel) {
    return;
  }

  this.channelEditForm.controls.description.setValue(
    currentChannel.description ?? ''
  );

  this.descriptionErrorMessage.set('');
  this.isEditingDescriptionName.set(true);
}

  cancelNameEdit(): void {
    this.isEditingName.set(false);
  }

  cancelDescriptionEdit(): void {
    this.isEditingDescriptionName.set(false);
  }

  async saveChannelName(): Promise<void> {
    const nameControl = this.channelEditForm.controls.name;
    const currentChannel = this.channelService.currentChannel();

    if (!currentChannel) {
      return;
    }

    if (nameControl.invalid) {
      nameControl.markAsTouched();
      return;
    }

    const newName = nameControl.getRawValue().trim();

    if (newName === currentChannel.name) {
      this.isEditingName.set(false);
      return;
    }

    this.isSavingName.set(true);
    this.nameErrorMessage.set('');

    try {
      await this.channelService.updateChannelName(
        currentChannel.id,
        newName
      );

      this.isEditingName.set(false);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'CHANNEL_ALREADY_EXISTS'
      ) {
        this.nameErrorMessage.set(
          'Dieser Channel-Name existiert bereits.'
        );
      } else {
        this.nameErrorMessage.set(
          'Der Channel-Name konnte nicht gespeichert werden.'
        );
      }
    } finally {
      this.isSavingName.set(false);
    }
  }

  async saveChannelDescription(): Promise<void> {
  const descriptionControl =
    this.channelEditForm.controls.description;

  const currentChannel =
    this.channelService.currentChannel();

  if (!currentChannel) {
    return;
  }

  if (descriptionControl.invalid) {
    descriptionControl.markAsTouched();
    return;
  }

  const newDescription =
    descriptionControl.getRawValue().trim();

  const currentDescription =
    currentChannel.description?.trim() ?? '';

  if (newDescription === currentDescription) {
    this.isEditingDescriptionName.set(false);
    return;
  }

  this.isSavingDescription.set(true);
  this.descriptionErrorMessage.set('');

  try {
    await this.channelService.updateChannelDescription(
      currentChannel.id,
      newDescription
    );

    this.isEditingDescriptionName.set(false);
  } catch (error) {
    this.descriptionErrorMessage.set(
      'Die Beschreibung konnte nicht gespeichert werden.'
    );
  } finally {
    this.isSavingDescription.set(false);
  }
}

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
