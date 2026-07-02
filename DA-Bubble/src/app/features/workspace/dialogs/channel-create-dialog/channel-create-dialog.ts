import { HostListener,Component, output, Host } from '@angular/core';

@Component({
  selector: 'app-channel-create-dialog',
  imports: [],
  templateUrl: './channel-create-dialog.html',
  styleUrl: './channel-create-dialog.scss',
})
export class ChannelCreateDialog {
  closeDialog = output<void>();

  constructor() {}

  close(): void {
    this.closeDialog.emit();
  } 
@HostListener('document:keydown.escape') 
  onEscape():void{
    this.close();
  } 
  
}
