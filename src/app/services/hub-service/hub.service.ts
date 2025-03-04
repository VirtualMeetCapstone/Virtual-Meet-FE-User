import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HubService {
  public hubConnection!: signalR.HubConnection;
  private videoSubject = new BehaviorSubject<{ videoId: string; timestamp: number; isPaused: boolean }>({
    videoId: '4Lq-I3xQxns',
    timestamp: 0,
    isPaused: true
  });

  private popupStateSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log('[HubService] Constructor: Starting SignalR connection...');
    this.startConnection();
  }

  private startConnection() {
    console.log('[HubService] startConnection: Creating hub connection...');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7035/videoHub', { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('[HubService] Connection established successfully');
        this.getCurrentVideo();  // Get current video status after connection is established
      })
      .catch(err => {
        console.error('[HubService] Connection error:', err);
      });

    // Receiving video updates from server
    this.hubConnection.on('ReceiveVideo', (videoId: string, timestamp: number, isPaused: boolean) => {
      console.log(`[HubService] Received video update: videoId=${videoId}, timestamp=${timestamp}, isPaused=${isPaused}`);
      this.videoSubject.next({ videoId, timestamp, isPaused });
    });

    // Receiving popup state updates from server
    this.hubConnection.on('ReceivePopupState', (isOpen: boolean) => {
      console.log(`[HubService] Received popup state: isOpen=${isOpen}`);
      this.popupStateSubject.next(isOpen);
    });
  }

  // Get video updates as observable
  getVideoUpdates() {
    console.log('[HubService] getVideoUpdates: Returning videoSubject as observable...');
    return this.videoSubject.asObservable();
  }

  // Invoke server method to change video
  changeVideo(videoId: string, timestamp: number = 0, isPaused: boolean = true) {
    console.log(`[HubService] changeVideo: Invoking server method to change video. videoId=${videoId}, timestamp=${timestamp}, isPaused=${isPaused}`);
    this.hubConnection.invoke('ChangeVideo', videoId, timestamp, isPaused)
      .catch(err => {
        console.error('[HubService] ChangeVideo error:', err);
      });
  }

  // Request current video from server
  getCurrentVideo() {
    console.log('[HubService] getCurrentVideo: Requesting current video from server...');
    this.hubConnection.invoke('GetCurrentVideo')
      .catch(err => {
        console.error('[HubService] GetCurrentVideo error:', err);
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
}
