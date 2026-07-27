import { HostListener, ElementRef, Component, inject, output } from '@angular/core';
import { DirectMessageService } from '../../../../core/services/direct-message.service';

@Component({
  selector: 'app-show-profil-dialog',
  imports: [],
  templateUrl: './show-profil-dialog.html',
  styleUrl: './show-profil-dialog.scss',
})
export class ShowProfilDialog {
  directMessageService = inject(DirectMessageService);
  elementRef = inject(ElementRef);
  closeProfilDialogEvent = output<void>();

  closeDialog(): void {
    this.closeProfilDialogEvent.emit()
  }

  async openDirectMessage(): Promise<void> {
    const user = this.directMessageService.currentDmUser();

    if (!user) {
      return;
    }
    await this.directMessageService.selectDmUser(user);
    this.closeDialog();
  }
}
