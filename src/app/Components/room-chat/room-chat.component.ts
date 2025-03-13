import { Component } from '@angular/core';

@Component({
  selector: 'app-room-chat',
  templateUrl: './room-chat.component.html',
  styleUrl: './room-chat.component.scss'
})
export class RoomChatComponent {
  messages = [
    { sender: 'Gấu', text: 'Hello!' },
    { sender: 'Mạnh Tường', text: 'Hi there!' },
    { sender: 'me', text: 'Hey everyone!' }
  ];
  newMessage = '';

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({ sender: 'me', text: this.newMessage });
      this.newMessage = '';
    }
  }
}
