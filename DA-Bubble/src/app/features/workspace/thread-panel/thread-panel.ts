import {ElementRef, HostListener, Component, inject, signal } from '@angular/core';
import {MessageService} from '../../../core/services/message.service'
import {ThreadHeader} from '../../../features/workspace/thread-panel/thread-header/thread-header'
import {ThreadInput} from '../../../features/workspace/thread-panel/thread-input/thread-input'
import {ThreadMessages} from '../../../features/workspace/thread-panel/thread-messages/thread-messages'
import { ReactionService } from '../../../core/services/reaction.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-thread-panel',
  imports: [ThreadHeader, ThreadInput,ThreadMessages, PickerComponent],
  templateUrl: './thread-panel.html',
  styleUrl: './thread-panel.scss',
})
export class ThreadPanel {
  messageService = inject(MessageService);
  reactionService = inject(ReactionService);
  elementRef = inject(ElementRef);
  openedReactionPickerId = signal<string | null>(null);

  toggleThreadEmojiPicker(messageId:string, event:Event):void{
    this.openedReactionPickerId.update((currentID)=>
    currentID === messageId ? null : messageId)
  }

  addThreadEmojiReaction(event:any, messageId:string):void{
    const emoji = event.emoji.native;
    this.reactionService.addReaction(messageId,emoji);
    this.openedReactionPickerId.set(null)
  }

  @HostListener('document:click', ['$event'])
  closeEmojiPickerOnOutsideClick(event:Event):void{
    const clickedOutside = this.elementRef.nativeElement.contains(event?.target)
    if(!clickedOutside){
      this.openedReactionPickerId.set(null)
    }
  }

 @HostListener('document:keydown.escape')
 closeEmojiPickerOnEscape():void{
  this.openedReactionPickerId.set(null)
 }

}
