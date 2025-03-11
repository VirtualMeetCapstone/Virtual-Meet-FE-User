import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
@Injectable({
  providedIn: 'root',
})
export class RoomHubService {
  private hubConnection: signalR.HubConnection;
  public currentUser = { name: '', roomId: '' };

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${AppConstants.API_BASE_URL_HTTPS}/roomHub`, { withCredentials: true })
    .withAutomaticReconnect()
    .build();
  }

  startSignalRConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Bắt đầu kết nối SignalR
        this.hubConnection.start()
          .then(() => {
            console.log("✅ SignalR connection established.");
            resolve(); // Kết nối thành công
          })
          .catch((err) => {
            console.error("❌ SignalR connection failed:", err);
            reject(err); // Lỗi kết nối
          });
      } catch (error) {
        reject(error);
      }
    });
  }

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
