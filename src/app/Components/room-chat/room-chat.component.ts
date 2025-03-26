import {Component, OnInit} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {AuthService} from "../../services/auth-service/auth.service";
import {ActivatedRoute} from "@angular/router";
import {RoomHubService} from "../../Hub/room-hub/room-hub.service";

@Component({
  selector: 'app-room-chat',
  templateUrl: './room-chat.component.html',
  styleUrls: ['./room-chat.component.scss']
})
export class RoomChatComponent implements OnInit {
  messages: any[] = [];
  newMessage: string = '';
  currentUser: string = '';
  private hubConnection!: signalR.HubConnection;
  private serverUrl = 'https://dev-vmeet.site/roomHub';
  private roomId = '';

  constructor(private authService: AuthService, private route: ActivatedRoute, private roomHubService: RoomHubService) {
  }

  async ngOnInit(): Promise<void> {
    this.currentUser = this.authService.getUserFromToken()?.id || localStorage.getItem('senderId') || '';
    this.route.paramMap.subscribe(params => {
      this.roomId = params.get('roomId') || ''; // ✅ Đảm bảo lấy đúng roomId từ route
      console.log('📌 RoomChatComponent - Room ID:', this.roomId);
    });
    this.hubConnection = this.roomHubService.getConnection();

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.log('⚠️ SignalR chưa kết nối, đợi kết nối...');
      return;
    }

    this.hubConnection.on('ReceiveMessage', (message) => {
      this.messages.push(message);
    });

    this.hubConnection.on('DeleteMessage', (messageId) => {
      this.messages = this.messages.filter(msg => msg.id !== messageId);
    });

    this.hubConnection.on('UpdateMessage', (message) => {
      const index = this.messages.findIndex(msg => msg.id === message.id);
      if (index !== -1) {
        this.messages[index] = message;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const messageData = {
      senderId: this.currentUser,
      content: this.newMessage,
      isPinned: false
    };
  console.log('RoomId: ', this.roomId);
  console.log("messageData: ", messageData);
    this.hubConnection.invoke('SendMessage', this.roomId, messageData)
      .then(() => this.newMessage = '')
      .catch(err => console.error('❌ Send error:', err));
  }
}
