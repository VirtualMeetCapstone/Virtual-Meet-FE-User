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

  // Bắt đầu kết nối SignalR
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

  // Tham gia phòng
  public async joinRoom(username: string, roomId: string): Promise<void> {
    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('❌ Connection is not in the Connected state.');
      return;
    }

    this.currentUser.roomId = roomId;
    await this.hubConnection.invoke('JoinRoom', username, roomId);
  }

  // Gửi like
  public async sendLike(): Promise<void> {
    await this.hubConnection.invoke('SendLike');
  }

  // Gửi share
  public async sendShare(): Promise<void> {
    await this.hubConnection.invoke('SendShare');
  }

  // Nhận thông báo like
  public receiveLike(callback: (username: string) => void): void {
    this.hubConnection.on('ReceiveLike', callback);
  }

  // Nhận thông báo share
  public receiveShare(callback: (username: string) => void): void {
    this.hubConnection.on('ReceiveShare', callback);
  }

  // Gửi yêu cầu lấy trạng thái phòng
  public async getRoomState(): Promise<void> {
    try {
      await this.hubConnection.invoke('GetRoomState');
    } catch (err) {
      console.error('❌ Lỗi lấy trạng thái phòng: ', err);
    }
  }

  // Gửi video đã chọn
  public async selectVideo(roomId: string, videoId: string): Promise<void> {
    console.log(`[HubService] Gửi video đã chọn cho room ${roomId}: ${videoId}`);
    try {
      await this.hubConnection.invoke('SelectVideo', roomId, videoId);
    } catch (err) {
      console.error('❌ Lỗi gửi video: ', err);
    }
  }

  // Nhận thông tin video từ server
  public onVideoSelected(callback: (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => void): void {
    if (!this.hubConnection) {
      console.error('⚠️ hubConnection chưa được khởi tạo!');
      return;
    }

    try {
      // Xóa sự kiện cũ trước khi đăng ký để tránh trùng lặp
      this.hubConnection.off('ReceiveSelectedVideo');

      // Đăng ký lắng nghe sự kiện từ SignalR Hub
      this.hubConnection.on('ReceiveSelectedVideo', (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => {
        console.log(`📨 Nhận event từ server - Room: ${roomId}, Video: ${videoId}, Time: ${timestamp}s, Paused: ${isPaused}`);
        callback(roomId, videoId, timestamp, isPaused);
      });

      console.log('✅ Đã đăng ký sự kiện ReceiveSelectedVideo thành công.');
    } catch (err) {
      console.error('❌ Lỗi đăng ký sự kiện ReceiveSelectedVideo:', err);
    }
  }

  // Gửi trạng thái player (play, pause, thời gian hiện tại)
  public async sendPlayerStatus(roomId: string, status: number, time: number): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('❌ SignalR chưa kết nối, không thể gửi trạng thái!');
      return;
    }

    try {
      await this.hubConnection.invoke('UpdatePlayerStatus', roomId, status, time);
    } catch (err) {
      console.error('❌ Lỗi gửi trạng thái: ', err);
    }
  }

  // Nhận trạng thái player từ server
  public onPlayerStatusReceived(callback: (roomId: string, status: number, time: number) => void): void {
    if (!this.hubConnection) {
      console.error('❌ SignalR chưa kết nối, không thể nhận trạng thái!');
      return;
    }

    this.hubConnection.on('receiveplayerstatus', (roomId, status, time) => {
      console.log(`📡 Nhận trạng thái mới: ${status}, thời gian: ${time}s`);
      callback(roomId, status, time);
    });
  }
}
