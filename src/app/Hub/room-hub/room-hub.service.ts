import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoomHubService {
  private hubConnection: signalR.HubConnection;
  public currentUser = { name: '', roomId: '' };

  constructor() {

    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7035/roomHub`, { withCredentials: true })
    .withAutomaticReconnect()
    .build();
  }

  public startConnection = () => {
    return this.hubConnection
      .start()
      .then(() => console.log('✅ Connection started'))
      .catch((err) => console.error('❌ Error while starting connection: ' + err));
  };
  // Join room
  public joinRoom = (username: string, roomId: string) => {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinRoom', username, roomId);
    } else {
      return Promise.reject('Connection is not in the Connected state.');
    }
  };

  // Gửi like
  public sendLike = () => {
    return this.hubConnection.invoke('SendLike');
  };

  // Gửi share
  public sendShare = () => {
    return this.hubConnection.invoke('SendShare');
  };

  // Nhận thông báo like
  public receiveLike = (callback: (username: string) => void) => {
    this.hubConnection.on('ReceiveLike', callback);
  };

  // Nhận thông báo share
  public receiveShare = (callback: (username: string) => void) => {
    this.hubConnection.on('ReceiveShare', callback);
  };
}
