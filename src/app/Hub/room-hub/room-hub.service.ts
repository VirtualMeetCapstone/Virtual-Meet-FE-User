import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Poll } from '../../Components/room-component/poll-component/poll-component.component';
import { UserDto } from '../../models/poll';

@Injectable({
  providedIn: 'root',
})
export class RoomHubService {
  public hubConnection: signalR.HubConnection;
  public currentUser = { name: '', userInfoName: '', roomId: '' };
  public UserDto: UserDto = {
    id: '',
    name: '',
  };
  public _audioEnabled = true;
  public _videoEnabled = true;
  public localStream: MediaStream | null = null;
  private urlBase = AppConstants.API_BASE_URL_HTTPS; // Địa chỉ API của bạn.
  private messagesSubject = new BehaviorSubject<any[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  // Observable subjects for UI updates
  private participantsSubject = new BehaviorSubject<number>(0);
  private connectionStateSubject = new BehaviorSubject<string>('disconnected');
  private confirmHandler: ((msg: string) => Promise<boolean>) | null = null;
  private roomListHubConnection!: signalR.HubConnection;
  constructor(
    private router: Router,
    private auth: AuthService,
    private http: HttpClient
  ) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.urlBase}/roomHub`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
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
    this.hubConnection.on('ReceiveMessage', (message) => {
      this.updateMessages(message);
    });

    this.hubConnection.on('DeleteMessage', (messageId) => {
      this.deleteMessage(messageId);
    });

    this.hubConnection.on('UpdateMessage', (message) => {
      this.updateMessage(message);
    });

    this.hubConnection.onclose((error) => {
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

  private updateMessages(message: any) {
    const current = this.messagesSubject.value;
    const exists = current.find((m) => m.id === message.id);
    if (!exists) {
      this.messagesSubject.next([...current, message]);
    }
  }

  private deleteMessage(id: string) {
    const updated = this.messagesSubject.value.filter((m) => m.id !== id);
    this.messagesSubject.next(updated);
  }

  private updateMessage(message: any) {
    const current = this.messagesSubject.value;
    const index = current.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      current[index] = message;
      this.messagesSubject.next([...current]);
    }
  }

  // Room management
  public async joinRoom(
    username: string,
    roomId: string,
    password: string = ''
  ): Promise<void> {
    if (!roomId) throw new Error('Room ID is required');

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      // 🎥🔊 Kiểm tra thiết bị có camera và mic
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === 'videoinput');
      const hasMicrophone = devices.some((d) => d.kind === 'audioinput');

      if (!hasCamera && !hasMicrophone) {
        alert('⚠️ Không phát hiện được camera hoặc micro.');
        return;
      }

      let useVideo = false;
      let useAudio = false;

      if (hasCamera) {
        useVideo = await this.showConfirm('Do you want to use the camera?');
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (hasMicrophone) {
        useAudio = await this.showConfirm('Do you want to use the microphone?');
      }

      const constraints = {
        video: useVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
        audio: useAudio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      };

      // ✅ Lấy stream - Only if video or audio is enabled
      if (useVideo || useAudio) {
        this.localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
      } else {
      }

      // 👤 Cập nhật người dùng và tham gia phòng
      this.currentUser.name = username;
      this.currentUser.userInfoName =
        (await this.auth.fetchUserName(username)) ?? '';

      this.UserDto.id = this.currentUser.name;
      this.UserDto.name = this.currentUser.userInfoName;

      this.currentUser.roomId = roomId;

      await this.hubConnection.invoke(
        'JoinRoom',
        username,
        roomId,
        password,
        true
      );
    } catch (err) {
      console.error('❌ Lỗi khi tham gia phòng:', err);
      throw err;
    }
  }

  setConfirmHandler(handler: (msg: string) => Promise<boolean>) {
    this.confirmHandler = handler;
  }

  private async showConfirm(message: string): Promise<boolean> {
    if (!this.confirmHandler) {
      console.warn('No confirm handler set.');
      return false;
    }
    return await this.confirmHandler(message);
  }

  async updateLocalStream(newStream: MediaStream): Promise<void> {
    // Dừng stream cũ nếu có
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    // Gán stream mới
    this.localStream = newStream;
    console.log('✅ Cập nhật stream mới:', newStream);

    // Cập nhật trạng thái mic và camera
    this._audioEnabled = newStream.getAudioTracks().length > 0;
    this._videoEnabled = newStream.getVideoTracks().length > 0;

    // Thông báo thay đổi stream cho UI
    this.onStreamUpdated();
  }
  private onStreamUpdated() {
    console.log(
      `🎤 Mic: ${this.audioEnabled}, 📹 Camera: ${this.videoEnabled}`
    );
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
    this.router.navigate(['/rooms']).then(() => {
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
    console.log('userName', this.currentUser.userInfoName);
    await this.hubConnection.invoke(
      'SendSubtitle',
      this.currentUser.roomId,
      this.currentUser.userInfoName,
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
  public receiveJoinFailed(callback: (message: string) => void): void {
    this.hubConnection.off('JoinFailed');

    this.hubConnection.on('JoinFailed', callback);
  }
  public receiveHostMuted(
    callback: (userId: string, muted: boolean) => void
  ): void {
    this.hubConnection.off('HostMutedUser');
    this.hubConnection.on(
      'HostMutedUser',
      (data: { userId: string; muted: boolean }) => {
        callback(data.userId, data.muted);
      }
    );
  }

  public receiveHostMutedVIdeo(
    callback: (userId: string, muted: boolean) => void
  ): void {
    this.hubConnection.off('HostMutedVideoUser');
    this.hubConnection.on(
      'HostMutedVideoUser',
      (data: { userId: string; muted: boolean }) => {
        callback(data.userId, data.muted);
      }
    );
  }

  public receiveRoomDeleted(callback: (roomId: string) => void): void {
    this.hubConnection.off('RoomDeleted');
    this.hubConnection.on('RoomDeleted', (roomId: string) => {
      console.log('Room deleted:', roomId);
      callback(roomId);
    });
  }

  public receiveRoomCreated(callback: (room: any) => void): void {
    this.roomListHubConnection.off('RoomCreated');
    this.roomListHubConnection.on('RoomCreated', (room: any) => {
      console.log('📌 New room created:', room);
      callback(room);
    });
  }


  public async kickUser(targetUserId: string, reason: string): Promise<void> {
    if (!this.currentUser.roomId) {
      console.error('❌ Không thể kick user vì không có roomId.');
      return;
    }

    try {
      await this.hubConnection.invoke(
        'KickUser',
        this.currentUser.roomId,
        targetUserId,
        reason
      );
      console.log(
        `📡 Đã gửi yêu cầu kick user: ${targetUserId} với lý do: ${reason}`
      );
    } catch (error) {
      console.error('❌ Lỗi khi gửi yêu cầu kick user:', error);
    }
  }

  public receiveHostKickUser(
    callback: (userId: string, reason: string) => void
  ): void {
    this.hubConnection.off('HostKickUser');
    this.hubConnection.on('HostKickUser', (userId: string, reason: string) => {
      callback(userId, reason);
    });
  }

  public async sendMute(targetId: string, muted: boolean): Promise<void> {
    if (!this.currentUser.roomId) {
      console.error('❌ Không thể gửi yêu cầu tắt/bật mic vì không có roomId.');
      return;
    }

    try {
      await this.hubConnection.invoke(
        'MuteUser',
        this.currentUser.roomId,
        targetId,
        muted
      );
      console.log(
        `📡 Đã gửi yêu cầu ${muted ? 'tắt' : 'bật'} mic cho user: ${targetId}`
      );
    } catch (error) {
      console.error('❌ Lỗi khi gửi yêu cầu tắt/bật mic:', error);
    }
  }

  public async sendVideoMute(targetId: string, muted: boolean): Promise<void> {
    if (!this.currentUser.roomId) {
      console.error(
        '❌ Không thể gửi yêu cầu tắt/bật video vì không có roomId.'
      );
      return;
    }

    try {
      await this.hubConnection.invoke(
        'MuteVideoUser',
        this.currentUser.roomId,
        targetId,
        muted
      );
      console.log(
        `📡 Đã gửi yêu cầu ${muted ? 'tắt' : 'bật'} video cho user: ${targetId}`
      );
    } catch (error) {
      console.error('❌ Lỗi khi gửi yêu cầu tắt/bật video:', error);
    }
  }

  public async sendMicStatus(isMicOn: boolean): Promise<void> {
    if (!this.currentUser.roomId) return console.error('❌ Not in a room');

    await this.hubConnection.invoke(
      'UpdateMicStatus',
      this.currentUser.roomId,
      this.currentUser.name,
      isMicOn
    );

    console.log(`🎤 Mic status sent: ${isMicOn ? 'ON' : 'OFF'}`);
  }

  public async sendVideoStatus(isVideoOn: boolean): Promise<void> {
    if (!this.currentUser.roomId) return console.error('❌ Not in a room');

    await this.hubConnection.invoke(
      'UpdateCameraStatus',
      this.currentUser.roomId,
      this.currentUser.name,
      isVideoOn
    );

    console.log(`📹 Video status sent: ${isVideoOn ? 'ON' : 'OFF'}`);
  }

  public receiveMicStatusUpdate(
    callback: (userId: string, isMicOn: boolean) => void
  ): void {
    this.hubConnection.off('ReceiveMicStatusUpdate');

    this.hubConnection.on(
      'ReceiveMicStatusUpdate',
      (userId: string, isMicOn: boolean) => {
        console.log(
          `🎤 Mic status updated for user ${userId}: ${isMicOn ? 'ON' : 'OFF'}`
        );
        callback(userId, isMicOn);
      }
    );
  }
  public videoStatusMap$ = new BehaviorSubject<{ [userId: string]: boolean }>(
    {}
  );

  public receiveVideoStatusUpdate(
    callback: (userId: string, isVideoOn: boolean) => void
  ): void {
    this.hubConnection.off('ReceiveCameraStatusUpdate');

    this.hubConnection.on(
      'ReceiveCameraStatusUpdate',
      (userId: string, isVideoOn: boolean) => {
        console.log(
          `📹 Video status updated for user ${userId}: ${
            isVideoOn ? 'ON' : 'OFF'
          }`
        );

        // Cập nhật trạng thái video trong danh sách
        const updatedMap = {
          ...this.videoStatusMap$.value,
          [this.currentUser.name]: this._videoEnabled,
        };
        this.videoStatusMap$.next(updatedMap);
        // Gọi callback để cập nhật UI
        callback(userId, isVideoOn);
      }
    );
  }

  public receiveConnectionID(callback: (connect: string) => void): void {
    this.hubConnection.off('ConnectionId');

    this.hubConnection.on('ConnectionId', callback);
  }

  getRoomInfo(roomId: string): Observable<any> {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/rooms/${roomId}`;
    return this.http.get<any>(url);
  }
  public createPoll(roomId: string, question: string, options: string[]): void {
    this.hubConnection
      .invoke('CreatePoll', this.UserDto, roomId, question, options)
      .catch((err) => console.error('[Poll] Lỗi khi tạo poll:', err));
  }

  public voteOnPoll(roomId: string, pollId: string, optionId: string): void {
    this.hubConnection
      .invoke('VoteOnPoll', this.UserDto, roomId, pollId, optionId)
      .catch((err) => console.error('[Poll] Lỗi khi vote poll:', err));
  }

  public receivePollUpdate(callback: (polls: Poll[]) => void): void {
    this.hubConnection.off('PollUpdated'); // Xóa listener cũ để tránh trùng lặp
    this.hubConnection.on('PollUpdated', (polls: Poll[]) => {
      console.log('[Poll] Nhận cập nhật Polls:', polls);
      callback(polls); // Gọi callback để cập nhật danh sách poll
    });
  }

  public deletePoll(roomId: string, pollId: string): void {
    this.hubConnection
      .invoke('DeletePollFromRoom', roomId, pollId)
      .catch((err) => console.error('[Poll] Lỗi khi xóa poll:', err));
  }

  public endPoll(roomId: string, pollId: string): void {
    this.hubConnection
      .invoke('EndPollInRoom', roomId, pollId)
      .catch((err) => console.error('[Poll] Lỗi khi kết thúc poll:', err));
  }

  public summarizeSubtitles(roomId: string): void {
    this.hubConnection
      .invoke('SummarizeSubtitles', roomId)
      .catch((err) => console.error('Lỗi khi gửi yêu cầu tóm tắt:', err));
  }

  sendCallSummaryMail(
    roomId: string,
    content: string,
    subject: string = 'Call Summary'
  ) {
    const params = new HttpParams()
      .set('subject', subject)
      .set('content', content);

    return this.http.post(
      `${AppConstants.API_BASE_URL_HTTPS}/rooms/${roomId}/send-summary-mail`,
      null,
      { params }
    );
  }

  public receiveSummary(callback: (summary: string) => void): void {
    this.hubConnection.off('ReceiveSummary');
    this.hubConnection.on('ReceiveSummary', (summary: string) => {
      callback(summary);
    });
  }
}
