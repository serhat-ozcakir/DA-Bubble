import { Component, inject } from '@angular/core';
import {MessageService} from '../../../core/services/message.service'
import {ThreadHeader} from '../../../features/workspace/thread-panel/thread-header/thread-header'
import {ThreadInput} from '../../../features/workspace/thread-panel/thread-input/thread-input'
import {ThreadMessages} from '../../../features/workspace/thread-panel/thread-messages/thread-messages'

@Component({
  selector: 'app-thread-panel',
  imports: [ThreadHeader, ThreadInput,ThreadMessages],
  templateUrl: './thread-panel.html',
  styleUrl: './thread-panel.scss',
})
export class ThreadPanel {
  messageService = inject(MessageService)

}
