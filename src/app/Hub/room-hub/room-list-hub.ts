import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class RoomListHubService {
  private hubConnection: signalR.HubConnection;
  private connectionStateSubject = new BehaviorSubject<string>('disconnected');
  private urlBase = AppConstants.API_BASE_URL_HTTPS; // Địa chỉ API của bạn.
  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
     .withUrl(`${this.urlBase}/roomListHub`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();
  }

  public startConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.connectionStateSubject.next('connected');
        resolve();
        return;
      }

      this.hubConnection
        .start()
        .then(() => {
          this.connectionStateSubject.next('connected');
          resolve();
        })
        .catch((err) => {
          this.connectionStateSubject.next('error');
          reject(err);
        });
    });
  }

  public receiveRoomCreated(callback: (room: any) => void): void {
    this.hubConnection.off('RoomCreated');
    this.hubConnection.on('RoomCreated', callback);
  }

  public receiveRoomUpdated(callback: (room: any) => void): void {
    this.hubConnection.off('RoomUpdated');
    this.hubConnection.on('RoomUpdated', callback);
  }

  public receiveRoomDeleted(callback: (roomId: string) => void): void {
    this.hubConnection.off('RoomDeleted');
    this.hubConnection.on('RoomDeleted', callback);
  }
}
