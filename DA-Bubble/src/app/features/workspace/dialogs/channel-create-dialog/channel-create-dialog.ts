import { HostListener, Component, output, Host } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  constructor() { }

  close(): void {
    this.closeDialog.emit();
  }
  
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  createChannel(): void {
    if (this.channelForm.invalid) {
      this.channelForm.markAllAsTouched();
      return;
    }
    const channelData = {
      name: this.channelForm.get('channelName')?.value?.trim(),
      description: this.channelForm.get('channelDescription')?.value?.trim() || '',
    };

    console.log('Channel Created:', channelData);
    this.close();
  }
}
