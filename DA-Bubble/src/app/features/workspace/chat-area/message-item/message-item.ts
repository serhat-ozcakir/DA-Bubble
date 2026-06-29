import {ElementRef, HostListener, Component, inject, input, Input, signal } from '@angular/core';
import { MessageView } from '../../../../core/models/message-view.model';
import {MessageService} from '../../../../core/services/message.service';
import { ReactionService } from '../../../../core/services/reaction.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-message-item',
  imports: [PickerComponent, FormsModule],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItemComponent {

  message= input.required<MessageView>();
  private messageService = inject(MessageService);
  reactionService = inject(ReactionService);
  isShowEmojiPicker = signal(false);
  private elementRef = inject(ElementRef);
  isMessageEdited = signal(false);
  editingMessageID = signal<string | null>(null);
  editingText = signal<string>('');

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event:Event){
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if(!clickedInside){
      this.isShowEmojiPicker.set(false);
      this.isMessageEdited.set(false);

    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape():void{
    this.isShowEmojiPicker.set(false);
    this.isMessageEdited.set(false);
  }

  openThread():void{
    this.messageService.openThread(this.message())
  }

  toggleEmojiPicker():void{
    this.isShowEmojiPicker.update(value=>!value)
  }
  addEmojiReaction(event:any):void{
    const emoji = event.emoji.native;

    this.reactionService.addReaction(this.message().id, emoji);
    this.isShowEmojiPicker.set(false);
  }

  toggleMessageEdited(event:Event):void{
    event.stopPropagation();
    this.isMessageEdited.update(value=>!value)
  }

  startEditingMessage(event:Event):void{
    console.log('edit:', this.message().id);
    event.stopPropagation();
    this.editingMessageID.set(this.message().id);
    this.editingText.set(this.message().text);
    this.isMessageEdited.set(false);
  }

  cancelEditMessage(event:Event):void{
    event.stopPropagation();
    this.editingMessageID.set(null);
    this.editingText.set('');
  }

 async saveEditedMessage(event:Event):Promise<void>{
     event.stopPropagation();
    await this.messageService.updateMessage(this.message().id, this.editingText());

    this.editingMessageID.set(null);
    this.editingText.set('');
  }
}
