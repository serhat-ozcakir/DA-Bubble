import { Component, input, output, signal } from '@angular/core';
import {ChatHeader} from "./chat-header/chat-header";
import {MessageInput} from "./message-input/message-input";
import {MessageList} from "./message-list/message-list";
import { NewMessage } from './new-message/new-message';

@Component({
  selector: 'app-chat-area',
  imports: [ChatHeader, MessageInput, MessageList,NewMessage],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {

openAddMembers = output<void>();
openMemberList = output<void>();
openChannelSettings = output<void>();
showNewMessage = input(false);
closeNewMessage = output<void>();
openShowProfil = output<void>();

closeNewMessageEmit():void{
  this.closeNewMessage.emit()
}
}
