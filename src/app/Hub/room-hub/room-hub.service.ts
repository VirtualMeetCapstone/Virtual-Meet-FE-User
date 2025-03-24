import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoomHubService {
  public hubConnection: signalR.HubConnection;
  public currentUser = { name: '', roomId: '' };
  private _audioEnabled = true;
  private _videoEnabled = true;
  private localStream: MediaStream | null = null;

  // Observable subjects for UI updates
  private participantsSubject = new BehaviorSubject<number>(0);
  private connectionStateSubject = new BehaviorSubject<string>('disconnected');

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${AppConstants.API_BASE_URL_HTTPS}/roomHub`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    // Setup non-WebRTC SignalR events
    this.setupSignalREvents();
  }

  // Public observables
  get participants$(): Observable<number> {
    return this.participantsSubject.asObservable();
  }

  get connectionState$(): Observable<string> {
    return this.connectionStateSubject.asObservable();
  }

  get isInRoom(): boolean {
    return !!this.currentUser.roomId;
  }

  get audioEnabled(): boolean {
    return this._audioEnabled;
  }

  get videoEnabled(): boolean {
    return this._videoEnabled;
  }

  getConnection(): signalR.HubConnection {
    return this.hubConnection;
  }

  // Connection management
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
          console.log('✅ SignalR connection established');
          this.connectionStateSubject.next('connected');
          resolve();
        })
        .catch((err) => {
          console.error('❌ Connection failed:', err);
          this.connectionStateSubject.next('error');
          reject(err);
        });
    });
  }

  // Setup non-WebRTC SignalR events
  private setupSignalREvents(): void {
    this.hubConnection.on('ReceiveRoomState', (state) => {
      console.log('📦 Received room state:', state);
    });

    this.hubConnection.on('RoomStateUpdated', (state) => {
      console.log('🔄 Room state updated:', state);
    });

    this.hubConnection.on('ReceiveSelectedVideo', (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => {
      console.log(`📨 Received video event - Room: ${roomId}, Video: ${videoId}, Time: ${timestamp}s, Paused: ${isPaused}`);
    });

    this.hubConnection.on('receiveplayerstatus', (roomId, status, time) => {
      console.log(`📡 Received player status: ${status}, time: ${time}s`);
    });

    this.hubConnection.on('ReceiveLike', (username: string) => {
      console.log(`👍 Received like from ${username}`);
    });

    this.hubConnection.on('ReceiveShare', (username: string) => {
      console.log(`🔗 Received share from ${username}`);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.connectionStateSubject.next('disconnected');
      if (this.currentUser.roomId) {
        this.currentUser.roomId = '';
      }
    })

    this.hubConnection.on('Disconnect', () => {
      console.log('🚨 Server yêu cầu ngắt kết nối!');
      this.cleanup();
    });


  }



  // Room management
  public async joinRoom(username: string, roomId: string): Promise<void> {
    if (!roomId) throw new Error('Room ID is required');

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.currentUser.name = username;
      this.currentUser.roomId = roomId;
      await this.hubConnection.invoke('JoinRoom', username, roomId);
      console.log(`✅ Joined room ${roomId} as ${username}`);
    } catch (err) {
      console.error('❌ Error joining room:', err);
      throw err;
    }
  }

  public async leaveRoom(): Promise<void> {
    if (!this.currentUser.roomId) return;

    await this.hubConnection.invoke('LeaveRoom', this.currentUser.roomId);
    const roomId = this.currentUser.roomId;
    this.currentUser.roomId = '';
    this.currentUser.name = '';
    this.participantsSubject.next(0);
    console.log(`✅ Left room ${roomId}`);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  // Media controls
  public toggleAudio(): void {
    if (this.localStream) {
      this._audioEnabled = !this._audioEnabled;
      this.localStream.getAudioTracks().forEach((track) => (track.enabled = this._audioEnabled));
      console.log(`🎤 Audio ${this._audioEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  public toggleVideo(): void {
    if (this.localStream) {
      this._videoEnabled = !this._videoEnabled;
      this.localStream.getVideoTracks().forEach((track) => (track.enabled = this._videoEnabled));
      console.log(`📹 Video ${this._videoEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Social features
  public async sendLike(): Promise<void> {
    if (!this.currentUser.roomId) return console.error('❌ Not in a room');
    await this.hubConnection.invoke('SendLike');
    console.log('👍 Like sent');
  }

  public async sendShare(): Promise<void> {
    if (!this.currentUser.roomId) return console.error('❌ Not in a room');
    await this.hubConnection.invoke('SendShare');
    console.log('🔗 Share sent');
  }

  // Video sync features
  public async selectVideo(roomId: string, videoId: string): Promise<void> {
    console.log(`[HubService] Gửi video đã chọn cho room ${roomId}: ${videoId}`);
    try {
      await this.hubConnection.invoke('SelectVideo', roomId, videoId);
    } catch (err) {
      console.error('❌ Lỗi gửi video: ', err);
    }
  }

  public async sendPlayerStatus(roomId: string, status: number, time: number): Promise<void> {
    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('❌ SignalR chưa kết nối, không thể gửi trạng thái!');
      return;
    }
    try {
      await this.hubConnection.invoke('UpdatePlayerStatus', roomId, status, time);
    } catch (err) {
      console.error('❌ Lỗi gửi trạng thái: ', err);
    }
  }

  // Event registration
  public onRoomStateReceived(callback: (state: any) => void): void {
    this.hubConnection.off('ReceiveRoomState');
    this.hubConnection.on('ReceiveRoomState', callback);
  }

  public onRoomStateUpdate(callback: (state: any) => void): void {
    this.hubConnection.off('RoomStateUpdated');
    this.hubConnection.on('RoomStateUpdated', callback);
  }

  public receiveLike(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveLike');
    this.hubConnection.on('ReceiveLike', callback);
  }

  public receiveShare(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveShare');
    this.hubConnection.on('ReceiveShare', callback);
  }

  public onVideoSelected(callback: (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => void): void {
    this.hubConnection.off('ReceiveSelectedVideo');
    this.hubConnection.on('ReceiveSelectedVideo', callback);
  }

  public onPlayerStatusReceived(callback: (roomId: string, status: number, time: number) => void): void {
    this.hubConnection.off('receiveplayerstatus');
    this.hubConnection.on('receiveplayerstatus', callback);
  }

  // Cleanup
  public cleanup(): void {
    if (this.currentUser.roomId) this.leaveRoom().catch(() => {});
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.hubConnection.stop().catch(() => {});
    this.participantsSubject.next(0);
    this.connectionStateSubject.next('disconnected');
    console.log('🧹 RoomHub resources cleaned up');
  }
}
