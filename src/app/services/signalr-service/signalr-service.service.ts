import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SignalrServiceService {

  private hubConnection!: signalR.HubConnection;
  private messagesSubject = new BehaviorSubject<{ sender: string; text: string }[]>([]);
  messages$ = this.messagesSubject.asObservable();

  constructor() {
    this.startConnection();
  }

  private startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://dev-vmeet.site/chatHub', {
        skipNegotiation: true,  // ⚠️ Nếu server chỉ hỗ trợ WebSocket, bật cái này
        transport: signalR.HttpTransportType.WebSockets // ⚠️ Ép dùng WebSocket
      })
      .configureLogging(signalR.LogLevel.Information) // 🔍 Bật log chi tiết
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR Connected'))
      .catch(err => console.error('❌ SignalR Error: ', err));

    this.hubConnection.onclose(error => {
      console.error("🔴 Connection closed: ", error);
    });

    this.hubConnection.onreconnecting(error => {
      console.warn("🟡 Reconnecting... ", error);
    });

    this.hubConnection.onreconnected(connectionId => {
      console.log("🟢 Reconnected! Connection ID: ", connectionId);
    });
  }


  sendMessage(sender: string, text: string) {
    this.hubConnection.invoke('Send', '8f616ba7-048a-4fc1-b298-164a1e4b4126', 1, { sender, text })
      .catch(err => console.error(err));
  }

}
