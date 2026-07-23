import { HostListener, ElementRef, Component, computed, inject,signal } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { Profile } from '../../../../core/models/profile.model';
import { Channel } from '../../../../core/models/channel.model';

@Component({
  selector: 'app-new-message',
  imports: [],
  templateUrl: './new-message.html',
  styleUrl: './new-message.scss',
})
export class NewMessage {
  userService = inject(UserService);
  channelService = inject(ChannelService);
  recipientSearchText = signal('');
  isRecipientDropdownOpen = signal(false);
  selectedUser = signal<Profile | null>(null);
  selectedChannel = signal<Channel | null>(null);
  private elementRef = inject(ElementRef);

  recipientMode = computed<'users' | 'channels'>(()=>{
    const search = this.recipientSearchText().trim();

    if(search.startsWith('#')){
      return 'channels'
    }
     return 'users';
  })

  filteredUsers = computed(()=>{
    const search = this.recipientSearchText().toLowerCase().trim().replace(/^@/, '');
     const users = this.userService.user();
    if(!search){
      return users;
    }
    return users.filter((user)=>
    user.name.toLowerCase().includes(search)||
    user.email.toLowerCase().includes(search)
  )
  })

  filteredChannels = computed(()=>{
    const search = this.recipientSearchText().toLowerCase().trim().replace(/^#/, '');
    const channels = this.channelService.channels();
    
    if(!search){
      return channels;
    }

    return channels.filter((channel)=>
    channel.name.toLowerCase().includes(search))
  })

  openRecipientDropdown(): void {
    if (this.selectedUser() || this.selectedChannel()) {
      return;
    }

    this.isRecipientDropdownOpen.set(true);
  }

  onRecipientInput(event:Event):void{
    const input = event.target as HTMLInputElement;
    this.recipientSearchText.set(input.value);
    this.isRecipientDropdownOpen.set(true);
  }

  selectUser(user:Profile):void{
    this.selectedUser.set(user);
    this.selectedChannel.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(false);
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel.set(channel);
    this.selectedUser.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(false);
  }

  clearRecipient(): void {
    this.selectedUser.set(null);
    this.selectedChannel.set(null);
    this.recipientSearchText.set('');
    this.isRecipientDropdownOpen.set(true);
  }

   @HostListener('document:click', ['$event'])
   closeUserMenuOnOutsideClick(event: MouseEvent): void{
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside){
      this.isRecipientDropdownOpen.set(false);
    }
   }

  @HostListener('document:keydown.escape')
  closeUserMenuOnEscape(): void{
    this.isRecipientDropdownOpen.set(false);
  }

}
