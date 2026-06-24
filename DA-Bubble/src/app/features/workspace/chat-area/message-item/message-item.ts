import {ElementRef, HostListener, Component, inject, input, Input, signal } from '@angular/core';
import { MessageView } from '../../../../core/models/message-view.model';
import {MessageService} from '../../../../core/services/message.service';
import { ReactionService } from '../../../../core/services/reaction.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


@Component({
  selector: 'app-message-item',
  imports: [PickerComponent],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItemComponent {

  message= input.required<MessageView>();
  private messageService = inject(MessageService);
  reactionService = inject(ReactionService);
  isShowEmojiPicker = signal(false);
  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event:Event){
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if(!clickedInside){
      this.isShowEmojiPicker.set(false)
    }
  }

  @HostListener('document:keydown.escape')
  closeEmojiPickerOnEscape():void{
    this.isShowEmojiPicker.set(false)
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

}
