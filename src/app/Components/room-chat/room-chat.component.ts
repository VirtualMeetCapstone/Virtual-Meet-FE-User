import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {AuthService} from "../../services/auth-service/auth.service";
import {ActivatedRoute} from "@angular/router";
import {RoomHubService} from "../../Hub/room-hub/room-hub.service";
import {ChatServicesService} from "../../services/chat-services/chat-services.service";

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

  constructor(private authService: AuthService, private route: ActivatedRoute,
              private roomHubService: RoomHubService, private chatService: ChatServicesService,
              private cdr: ChangeDetectorRef) {
  }

  private isEventRegistered = false; // ✅ Tránh lặp sự kiện

  async ngOnInit(): Promise<void> {
    this.currentUser = this.authService.getUserFromToken()?.id || localStorage.getItem('senderId') || '';

    this.route.paramMap.subscribe(params => {
      this.roomId = params.get('roomId') || '';
      console.log('📌 RoomChatComponent - Room ID:', this.roomId);
      this.messages = this.chatService.getMessages(this.roomId);
    });

    this.hubConnection = this.roomHubService.getConnection();

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.log('⚠️ SignalR chưa kết nối, đợi kết nối...');
      return;
    }

    if (!this.isEventRegistered) {
      this.isEventRegistered = true;

      this.hubConnection.off('ReceiveMessage');
      this.hubConnection.on('ReceiveMessage', (message) => {
        const tempIndex = this.messages.findIndex(msg => msg.id.startsWith('temp-'));
        if (tempIndex !== -1) {
          this.messages[tempIndex] = message;
        } else if (!this.messages.some(msg => msg.id === message.id)) {
          this.messages.push(message);
        }

        this.chatService.saveMessages(this.roomId, this.messages);
        this.cdr.detectChanges();
      });

      this.hubConnection.off('DeleteMessage');
      this.hubConnection.on('DeleteMessage', (messageId) => {
        this.messages = this.messages.filter(msg => msg.id !== messageId);
        this.chatService.saveMessages(this.roomId, this.messages);
        this.cdr.detectChanges();
      });

      this.hubConnection.off('UpdateMessage');
      this.hubConnection.on('UpdateMessage', (message) => {
        const index = this.messages.findIndex(msg => msg.id === message.id);
        if (index !== -1) {
          this.messages[index] = message;
          this.chatService.saveMessages(this.roomId, this.messages);
          this.cdr.detectChanges();
        }
      });
    }
  }


  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const messageData = {
      id: tempId,
      senderId: this.currentUser,
      content: this.newMessage,
      isPinned: false
    };

    console.log('RoomId: ', this.roomId);
    console.log("messageData: ", messageData);

    this.messages.push(messageData);
    this.cdr.detectChanges();

    this.newMessage = '';

    this.hubConnection.invoke('SendMessage', this.roomId, messageData)
      .catch(err => console.error('❌ Send error:', err));
  }


}
