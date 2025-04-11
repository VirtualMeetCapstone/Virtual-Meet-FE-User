import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoomHubService {
  public hubConnection: signalR.HubConnection;
  public currentUser = { name: '', roomId: '' };
  public _audioEnabled = true;
  public _videoEnabled = true;
  public localStream: MediaStream | null = null;
  private urlBase = AppConstants.API_BASE_URL_HTTPS;
  // Observable subjects for UI updates
  private participantsSubject = new BehaviorSubject<number>(0);
  private connectionStateSubject = new BehaviorSubject<string>('disconnected');

  constructor(private router: Router, private auth: AuthService) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.urlBase}/roomHub`, {
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
    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.connectionStateSubject.next('disconnected');

      if (this.currentUser.roomId) {
        this.currentUser.roomId = '';
      }
      this.router.navigate(['/']).then(() => {
        window.location.reload();
      });
    });

    this.hubConnection.on('Disconnect', () => {
      console.log('🚨 Server yêu cầu ngắt kết nối!');
      this.leaveRoom();
      this.cleanup();
    });
  }

  // Room management
  public async joinRoom(
    username: string,
    roomId: string,
    password: string = ''
  ): Promise<void> {
    if (!roomId) throw new Error('Room ID is required');
    console.log('userName', username);

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      // Kiểm tra các thiết bị hiện có
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === 'videoinput');
      const hasMicrophone = devices.some(
        (device) => device.kind === 'audioinput'
      );

      // Cho phép lựa chọn nếu có cả camera và mic
      let constraints;

      if (hasCamera && hasMicrophone) {
        const useVideo = window.confirm(
          'Bạn có muốn sử dụng camera không? (Nhấn OK: có, Nhấn Cancel: không)'
        );
        const useAudio = window.confirm(
          'Bạn có muốn sử dụng mic không? (Nhấn OK: có, Nhấn Cancel: không)'
        );

        constraints = {
          video: useVideo
            ? { width: { ideal: 640 }, height: { ideal: 360 } }
            : false,
          audio: useAudio,
        };
      } else if (hasCamera) {
        constraints = {
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: false,
        };
      } else if (hasMicrophone) {
        constraints = { video: false, audio: true };
      } else {
        alert('⚠️ Không phát hiện được camera hoặc micro.');
        return;
      }

      // ✅ Lấy stream theo constraints cuối cùng
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Cập nhật thông tin người dùng và tham gia phòng
      this.currentUser.name = username;
      this.currentUser.roomId = roomId;
      await this.hubConnection.invoke('JoinRoom', username, roomId, password);
      console.log(`✅ Joined room ${roomId} as ${username}`);
    } catch (err) {
      console.error('❌ Error joining room:', err);
      throw err;
    }
  }

  async updateLocalStream(newStream: MediaStream): Promise<void> {
    // Dừng stream cũ nếu có
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    // Gán stream mới
    this.localStream = newStream;
    console.log("✅ Cập nhật stream mới:", newStream);

    // Cập nhật trạng thái mic và camera
    this._audioEnabled = newStream.getAudioTracks().length > 0;
    this._videoEnabled = newStream.getVideoTracks().length > 0;

    // Thông báo thay đổi stream cho UI
    this.onStreamUpdated();
  }
  private onStreamUpdated() {
    console.log(`🎤 Mic: ${this.audioEnabled}, 📹 Camera: ${this.videoEnabled}`);
  }

  public async fetchLiveKitToken(): Promise<string> {
    try {
      const name = await this.auth.fetchUserName(this.currentUser.name);
      const response = await fetch(`${this.urlBase}/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: this.currentUser.roomId,
          participantName: name,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Body: ${errorText}`
        );
      }
      const token = await response.text();

      return token;
    } catch (error) {
      console.error('❌ Error fetching LiveKit token:', error);
      throw error;
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
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  // Thêm phương thức gửi Raise Hand
  public async sendRaiseHand(): Promise<void> {
    const userName = this.currentUser.name;
    await this.hubConnection.invoke(
      'SendRaiseHand',
      userName,
      this.currentUser.roomId
    );
  }

  public async sendLowerHand(): Promise<void> {
    const userName = this.currentUser.name;
    await this.hubConnection.invoke(
      'SendLowerHand',
      userName,
      this.currentUser.roomId
    );
  }

  public async sendSubtitle(
    subtitle: string,
    sourceLang: string
  ): Promise<void> {
    const userName = this.currentUser.name;
    await this.hubConnection.invoke(
      'SendSubtitle',
      this.currentUser.roomId,
      userName,
      subtitle,
      sourceLang
    );
  }

  // Thêm phương thức gửi Emotion
  public async sendEmotion(type: string, x: number, y: number): Promise<void> {
    const userName = this.currentUser.name;
    const roomId = this.currentUser.roomId;
    await this.hubConnection.invoke(
      'SendEmotion',
      userName,
      roomId,
      type,
      x,
      y
    );
  }

  // Thêm hàm lắng nghe Raise Hand
  public receiveRaiseHand(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveRaiseHand');
    this.hubConnection.on('ReceiveRaiseHand', callback);
  }

  public receiveLowerHand(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveLowerHand');
    this.hubConnection.on('ReceiveLowerHand', callback);
  }

  public ReceiveJoinNotification(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveJoinNotification');
    this.hubConnection.on('ReceiveJoinNotification', callback);
  }

  public receiveSubtitle(
    callback: (username: string, subtitle: string, sourceLang: string) => void
  ): void {
    this.hubConnection.off('ReceiveSubtitle');
    this.hubConnection.on(
      'ReceiveSubtitle',
      (username, subtitle, sourceLang) => {
        callback(username, subtitle, sourceLang);
      }
    );
  }

  // Thêm hàm lắng nghe Emotion
  public receiveEmotion(
    callback: (username: string, type: string, x: number, y: number) => void
  ): void {
    this.hubConnection.off('ReceiveEmotion');
    this.hubConnection.on('ReceiveEmotion', callback);
  }

  // Media controls

  public disableAudio(): void {
    if (this.localStream) {
      this._audioEnabled = false;
      this.localStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
      console.log('🎤 Audio disabled');
    }
  }

  public disableVideo(): void {
    if (this.localStream) {
      this._videoEnabled = false;
      this.localStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = false));
      console.log('📹 Video disabled');
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
    console.log(
      `[HubService] Gửi video đã chọn cho room ${roomId}: ${videoId}`
    );
    try {
      await this.hubConnection.invoke('SelectVideo', roomId, videoId);
    } catch (err) {
      console.error('❌ Lỗi gửi video: ', err);
    }
  }

  public async sendPlayerStatus(
    roomId: string,
    status: number,
    time: number
  ): Promise<void> {
    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('❌ SignalR chưa kết nối, không thể gửi trạng thái!');
      return;
    }
    try {
      await this.hubConnection.invoke(
        'UpdatePlayerStatus',
        roomId,
        status,
        time
      );
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

  public onVideoSelected(
    callback: (
      roomId: string,
      videoId: string,
      timestamp: number,
      isPaused: boolean
    ) => void
  ): void {
    this.hubConnection.off('ReceiveSelectedVideo');
    this.hubConnection.on('ReceiveSelectedVideo', callback);
  }

  public onPlayerStatusReceived(
    callback: (roomId: string, status: number, time: number) => void
  ): void {
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
