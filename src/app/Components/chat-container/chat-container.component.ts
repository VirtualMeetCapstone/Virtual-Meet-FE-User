import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrl: './chat-container.component.scss'
})
export class ChatContainerComponent {
  selectedChat: any = null;

  onChatSelected(chat: any) {
    this.selectedChat = chat;
  }
}
