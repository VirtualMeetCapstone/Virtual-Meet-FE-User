import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
@Injectable({
  providedIn: 'root'
})
//videoHUbservice
export class VideoHub {
  private hubConnection!: signalR.HubConnection;

  private popupStateSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  //start
  startConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      // .configureLogging(signalR.LogLevel.Debug)
      .withUrl(`${AppConstants.API_BASE_URL_HTTPS}/videoHub`, {
        withCredentials: true,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();
         // Receiving popup state updates from server
    this.hubConnection.on('ReceivePopupState', (isOpen: boolean) => {
      this.popupStateSubject.next(isOpen);
    });
    return this.hubConnection.start()
      .then(() => console.log("✅ SignalR Connected"))
      .catch(err => {
        console.error("❌ Lỗi kết nối SignalR: ", err);
        throw err;
      });
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

    // Toggle popup state and notify server
    togglePopup(isOpen: boolean) {
      console.log(`[HubService] togglePopup: Invoking server method to toggle popup state. isOpen=${isOpen}`);
      this.hubConnection.invoke('TogglePopup', isOpen)
        .catch(err => {
          console.error('[HubService] TogglePopup error:', err);
        });
    }

      // Get popup state as observable
  getPopupState() {
    console.log('[HubService] getPopupState: Returning popupStateSubject as observable...');
    return this.popupStateSubject.asObservable();
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


}
