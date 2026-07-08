import { Component, output, signal } from '@angular/core';
import {ChatHeader} from "./chat-header/chat-header";
import {MessageInput} from "./message-input/message-input";
import {MessageList} from "./message-list/message-list";

@Component({
  selector: 'app-chat-area',
  imports: [ChatHeader, MessageInput, MessageList],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {

openAddMembers = output<void>();
openMemberList = output<void>();

}
