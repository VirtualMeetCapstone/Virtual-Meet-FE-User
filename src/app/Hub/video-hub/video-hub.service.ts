import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import { BehaviorSubject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
@Injectable({
  providedIn: 'root'
})
export class VideoHubService {

  public hubConnection!: signalR.HubConnection;

  private popupStateSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  //start
  startConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      // .configureLogging(signalR.LogLevel.Debug)
      .withUrl(`${AppConstants.API_BASE_URL_HTTPS}/videoHub`, {
        withCredentials: true,
        // skipNegotiation: true,
        // transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    return this.hubConnection.start()
      .then(() => console.log("✅ SignalR Connected"))
      .catch(err => {
        console.error("❌ Lỗi kết nối SignalR: ", err);
        throw err;
      });
  }


  selectVideo(videoId: string): void {
    console.log(`[HubService] Gửi video đã chọn: ${videoId}`);
    this.hubConnection.invoke('SelectVideo', videoId)
      .catch(err => console.error("❌ Lỗi gửi video: ", err));
  }

  onVideoSelected(callback: (videoId: string) => void) {
    this.hubConnection.on('ReceiveSelectedVideo', (videoId) => {
      console.log(`📡 Nhận video từ Hub: ${videoId}`);
      callback(videoId);
    });
  }

  //code moi

  // selectVideo(roomId: string, videoId: string): void {
  //   console.log(`[HubService] Gửi video đã chọn cho room ${roomId}: ${videoId}`);
  //   this.hubConnection.invoke('SelectVideo', roomId, videoId)
  //     .catch(err => console.error("❌ Lỗi gửi video: ", err));
  // }
  // onVideoSelected(callback: (roomId: string, videoId: string) => void): void {
  //   try {
  //     this.hubConnection.on('ReceiveSelectedVideo', (roomId, videoId) => {
  //       console.log("📨 Nhận event từ server");
  //       callback(roomId, videoId);
  //     });
  //   } catch (err) {
  //     console.error("❌ Lỗi đăng ký sự kiện:", err);
  //   }
  // }

  handleReceiveSelectedVideo(): void {
    try {
      this.hubConnection.on('ReceiveSelectedVideo', (roomId, videoId) => {
        console.log("📡 [Tab B] Nhận video từ Hub");
        console.log(`➡️ Room: ${roomId}`);
        console.log(`🎬 Video: ${videoId}`);
      });

      console.log("👂 [Tab B] Đã đăng ký lắng nghe ReceiveSelectedVideo");
    } catch (err) {
      console.error("❌ Lỗi đăng ký sự kiện:", err);
    }
  }




  sendPlayerStatus(status: number, time: number) {
    if (!this.hubConnection) {
      console.error("❌ SignalR chưa kết nối, không thể gửi trạng thái!");
      return;
    }
    this.hubConnection.invoke('UpdatePlayerStatus', status, time)
      .catch(err => console.error("❌ Lỗi gửi trạng thái: ", err));
  }

  onPlayerStatusReceived(callback: (status: number, time: number) => void) {
    if (!this.hubConnection) {
      console.error("❌ SignalR chưa kết nối, không thể nhận trạng thái!");
      return;
    }
    this.hubConnection.on('receiveplayerstatus', (status, time) => {
      console.log(`📡 Nhận trạng thái mới: ${status}, thời gian: ${time}s`);
      callback(status, time);
    });
  }





}
