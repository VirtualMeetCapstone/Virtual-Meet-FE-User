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

  public startConnection = async () => {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      return this.hubConnection
        .start()
        .then(() => console.log('✅ Connection started'))
        .catch((err) => console.error('❌ Error while starting connection:', err));
    } else {
      console.warn('⚠️ HubConnection is already connected or connecting.');
    }
  };

  // Join room
  public joinRoom = (username: string, roomId: string) => {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.currentUser.roomId = roomId;
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

  selectVideo(roomId: string, videoId: string): void {
    console.log(`[HubService] Gửi video đã chọn cho room ${roomId}: ${videoId}`);
    this.hubConnection.invoke('SelectVideo', roomId, videoId)
      .catch(err => console.error("❌ Lỗi gửi video: ", err));
  }
  onVideoSelected(callback: (roomId: string, videoId: string) => void): void {
    if (!this.hubConnection) {
        console.error("⚠️ hubConnection chưa được khởi tạo!");
        return;
    }

    try {
        // Xóa sự kiện cũ trước khi đăng ký để tránh trùng lặp
        this.hubConnection.off('ReceiveSelectedVideo');

        // Đăng ký lắng nghe sự kiện từ SignalR Hub
        this.hubConnection.on('ReceiveSelectedVideo', (roomId: string, videoId: string) => {
            console.log(`📨 Nhận event từ server - Room: ${roomId}, Video: ${videoId}`);
            callback(roomId, videoId);
        });

        console.log("✅ Đã đăng ký sự kiện ReceiveSelectedVideo thành công.");
    } catch (err) {
        console.error("❌ Lỗi đăng ký sự kiện ReceiveSelectedVideo:", err);
    }
}

sendPlayerStatus(roomId: string,status: number, time: number) {
  if (!this.hubConnection) {
    console.error("❌ SignalR chưa kết nối, không thể gửi trạng thái!");
    return;
  }
  this.hubConnection.invoke('UpdatePlayerStatus', roomId,status, time)
    .catch(err => console.error("❌ Lỗi gửi trạng thái: ", err));
}

onPlayerStatusReceived(callback: (roomId: string,status: number, time: number) => void) {
  if (!this.hubConnection) {
    console.error("❌ SignalR chưa kết nối, không thể nhận trạng thái!");
    return;
  }
  this.hubConnection.on('receiveplayerstatus', (roomId,status, time) => {
    console.log(`📡 Nhận trạng thái mới: ${status}, thời gian: ${time}s`);
    callback(roomId,status, time);
  });
}
}
