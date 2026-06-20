import { Component, inject, ElementRef, HostListener, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../../core/services/message.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-thread-input',
  imports: [FormsModule,PickerComponent],
  templateUrl: './thread-input.html',
  styleUrl: './thread-input.scss',
})
export class ThreadInput {
  private messsageServis = inject(MessageService);
  private elementRef = inject(ElementRef);

  replyText = '';
  showEmojiPicker = false;

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event:MouseEvent):void{
    const threadClickedInside = this.elementRef.nativeElement.contains(event.target);
    if(!threadClickedInside){
      this.showEmojiPicker = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape():void{
    this.showEmojiPicker = false;
  }

  async sendReply():Promise<void>{
    const text = this.replyText.trim();
    if(!text) return;
    await this.messsageServis.sendThreadMessage(text);
    this.replyText = '';
  }

  toggleEmojiPicker():void{
    this.showEmojiPicker = !this.showEmojiPicker
  }

  addEmoji(event:any):void{
    const emoji = event.emoji.native || event.emoji.colons || '';
    this.replyText += emoji;
    this.showEmojiPicker = false;
  }
}
