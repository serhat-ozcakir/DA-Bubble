import {Component, inject, input, output, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';
import { Auth } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-channel-detail',
  imports: [ReactiveFormsModule],
  templateUrl: './channel-detail.html',
  styleUrl: './channel-detail.scss',
})

export class ChannelDetail {
  channelService = inject(ChannelService);
  authService = inject(Auth);

  closeChannelSettings = output<void>();
  openAddMembersDialog = output<void>();

  SidebarClosed = input<boolean>(false);
  mobileFullPage = input<boolean>(false);

  isLeaving = signal(false);
  leaveErrorMessage = signal('');
  isEditingName = signal(false);
  isEditingDescriptionName = signal(false);
  isSavingName = signal(false);
  isSavingDescription = signal(false);
  nameErrorMessage = signal('');
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

  openAddMembers(): void {
    this.openAddMembersDialog.emit();
  }

  // Initializes the name field from the active channel
  // before entering edit mode.
  startEditingName(): void {
    const channel = this.channelService.currentChannel();
    if (!channel) return;

    this.channelEditForm.controls.name.setValue(channel.name);
    this.nameErrorMessage.set('');
    this.isEditingName.set(true);
  }

  startEditingDescription(): void {
    const channel = this.channelService.currentChannel();
    if (!channel) return;

    this.channelEditForm.controls.description.setValue(
      channel.description ?? ''
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
  
  // Validates and normalizes the name, skipping the request
  // when the value has not actually changed.
  async saveChannelName(): Promise<void> {
    const control = this.channelEditForm.controls.name;
    const channel = this.channelService.currentChannel();

    if (!channel || !this.isControlValid(control)) return;

    const newName = control.getRawValue().trim();
    if (this.isSameName(newName, channel.name)) return;
    await this.updateChannelName(channel.id, newName);
  }

  private async updateChannelName(channelId: string,newName: string): Promise<void> {
    this.startNameSaving();

    try {
      await this.channelService.updateChannelName(channelId,newName);
      this.isEditingName.set(false);
    } catch (error) {
      this.handleNameSaveError(error);
    } finally {
      this.isSavingName.set(false);
    }
  }

  private startNameSaving(): void {
    this.isSavingName.set(true);
    this.nameErrorMessage.set('');
  }

  // Maps the known duplicate-name error to a specific
  // message while keeping a fallback for other failures.
  private handleNameSaveError(error: unknown): void {
    const message = this.isDuplicateChannelError(error)
      ? 'Dieser Channel-Name existiert bereits.'
      : 'Der Channel-Name konnte nicht gespeichert werden.';

    this.nameErrorMessage.set(message);
  }

  private isDuplicateChannelError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message === 'CHANNEL_ALREADY_EXISTS'
    );
  }

  // Closes edit mode without sending an update
  // when the channel name is unchanged.
  private isSameName(newName: string, currentName: string): boolean {
    if (newName !== currentName) return false;
    this.isEditingName.set(false);
    return true;
  }

  // Avoids unnecessary updates when the normalized
  // description matches the currently stored value.
  async saveChannelDescription(): Promise<void> {
    const control = this.channelEditForm.controls.description;
    const channel = this.channelService.currentChannel();

    if (!channel || !this.isControlValid(control)) return;

    const newDescription = control.getRawValue().trim();
    const currentDescription = channel.description?.trim() ?? '';

    if (this.isSameDescription(newDescription,currentDescription)) return;
    await this.updateDescription( channel.id, newDescription);
  }

  private async updateDescription(channelId: string, description: string): Promise<void> {
    this.startDescriptionSaving();

    try {
      await this.channelService.updateChannelDescription(channelId, description);
      this.isEditingDescriptionName.set(false);
    } catch {
      this.setDescriptionSaveError();
    } finally {
      this.isSavingDescription.set(false);
    }
  }

  private startDescriptionSaving(): void {
    this.isSavingDescription.set(true);
    this.descriptionErrorMessage.set('');
  }

  private setDescriptionSaveError(): void {
    this.descriptionErrorMessage.set(
      'Die Beschreibung konnte nicht gespeichert werden.'
    );
  }

  private isSameDescription(newDescription: string,currentDescription: string):
   boolean {
    if (newDescription !== currentDescription) return false;
    this.isEditingDescriptionName.set(false);
    return true;
  }
  // Marks invalid controls as touched so validation feedback
  // becomes visible before saving.
  private isControlValid( control: FormControl<string>): boolean {
    if (!control.invalid) return true;
    control.markAsTouched();
    return false;
  }

  close(): void {
    this.closeChannelSettings.emit();
  }

  // Closes the settings only after the user has
  // successfully left the active channel.
  async leaveChannel(): Promise<void> {
    const channel = this.channelService.currentChannel();
    if (!channel) return;
    this.startLeaving();

    try {
      await this.channelService.leaveChannel(channel.id);
      this.close();
    } catch (error) {
      this.handleLeaveError(error);
    } finally {
      this.isLeaving.set(false);
    }
  }

  private startLeaving(): void {
    this.isLeaving.set(true);
    this.leaveErrorMessage.set('');
  }

  private handleLeaveError(error: unknown): void {
    this.leaveErrorMessage.set('Unable to leave the channel');
  }
}