import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  Injector,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { RtcHubService } from '../../Hub/rtc-hub/rtc-hub.service';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubePlayerComponent } from '../../Components/youtube-player/youtube-player.component';
import { AuthService } from '../../services/auth-service/auth.service';
import { Peer } from '../../models/rtc/pere';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss',
})
export class RoomComponentComponent implements OnInit {
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: any) {
    this.leaveRoom();
  }

  @ViewChild(YoutubePlayerComponent) youtubeComponent!: YoutubePlayerComponent;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
    private rtcHub: RtcHubService,
    private injector: Injector,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.userId = authService.getUser()?.id;
  }

//start init
  roomId: string = '';
  userId: string = '';
  userList: string[] = [];
  user: any = null;
  raisedHands: string[] = [];
  private videoElement: HTMLVideoElement | null = null;
  isYouTubeActive = false; // Trạng thái của hoạt động YouTube
  isParticipantsOpen = false;
  isActivityModalOpen: boolean = false;
  isChatOpen = false;
  roomState: any; // Thêm biến lưu trạng thái
  connectionStatus: string = 'Connecting...';
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  participantCount = 0;
  peers: Peer[] = [];
  isScreenSharing = false;
  isMicOn: boolean = true;
  isCameraOn: boolean = true;

  isRecordingModalOpen: boolean = false;
  isRecording: boolean = false;
  recordWithAudio: boolean = true;

  pinnedUser: Peer | null = null;
  isPinned: boolean = false;
  bubbles: { type: string; userName: string; x: number; y: number }[] = [];
//end init

  ngOnDestroy() {
    this.leaveRoom();
  }
  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const roomId = params.get('roomId');
      if (roomId) {
        this.roomId = roomId;
        localStorage.setItem('roomId', this.roomId);
        console.log('📌 Room ID từ router:', this.roomId);
      }
    });

    try {
      await this.roomHubService.startConnection();
      this.connectionStatus = 'Connected';

      this.roomHubService.onRoomStateReceived((state) => {
        this.roomState = state;
        if (state.sharing) {
          this.isYouTubeActive = true;
          this._playerService.initializePlayer(
            state.videoId,
            state.time,
            state.isPaused
          );
        }
      });
      this.user = await this.authService.getBackendUser(this.userId);
      await this.roomHubService.joinRoom(this.userId, this.roomId);

      this.initializeEventListeners();

      this.roomHubService.participants$.subscribe(count => {
        this.participantCount = count;
      });

      this.rtcHub.peers$.subscribe(peers => {
        this.peers = peers;
      });

      await this.displayLocalStream();

    } catch (err) {
      console.error('❌ Lỗi khởi tạo phòng:', err);
      this.connectionStatus = 'Connection failed';
    }
  }

  getVideoGridClass(): string {
    const userCount = this.peers.length;
    return `users-${Math.min(userCount, 12)}`;
  }
  getDisplayedParticipants() {
    const maxDisplay = 11;
    return this.peers.slice(0, maxDisplay);
  }

  getRemainingCount() {
    const maxDisplay = 11;
    return this.peers.length > maxDisplay
      ? this.peers.length - maxDisplay
      : 0;
  }

  private initializeEventListeners(): void {
    this.roomHubService.receiveShare((username) => {
      this.isYouTubeActive = true;
    });

    this.roomHubService.onVideoSelected((roomId, videoId, time, isPaused) => {
      this._playerService.initializePlayer(videoId, time, isPaused);
    });
  }

  // Hàm mở/đóng modal chọn hoạt động
  toggleActivityModal() {
    this.isActivityModalOpen = !this.isActivityModalOpen;
  }

  // Hàm đóng modal
  closeActivityModal() {
    this.isActivityModalOpen = false;
  }
  closeAllModals() {
    this.isActivityModalOpen = false;

    if (this.isYouTubeActive) {
      this._playerService.pauseVideo(); // Dừng video cục bộ trên A
    }
    this.isYouTubeActive = false;
  }

  // Hàm chọn YouTube Together
  startYouTubeTogether() {
    if (this.isYouTubeActive) {
      console.log('⚠️ YouTube đã mở trước đó, chỉ đóng modal.');
      this.closeActivityModal();
      return;
    }
    this.isYouTubeActive = true;
    this.closeActivityModal();

    this.roomHubService
      .sendShare()
      .then(() => console.log('✅ Đã gửi sự kiện share'))
      .catch((err) => console.error('❌ Lỗi khi gửi sự kiện share:', err));
  }

  // Hàm chọn Whiteboard
  startWhiteboard() {
    this.isYouTubeActive = false;
    this.closeActivityModal();
    // Thực hiện thêm logic khi chọn Whiteboard (ví dụ: mở bảng vẽ)
  }
  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  toggleParticipants() {
    this.isParticipantsOpen = !this.isParticipantsOpen;
  }
  toggleClose() {
    this.isChatOpen = false;
    this.isParticipantsOpen = false;
  }

  async leaveRoom() {
    try {
      await this.roomHubService.leaveRoom();

    } catch (err) {
      console.error('Error leaving room:', err);
    }
  }



  toggleAudio(): void {
    this.roomHubService.toggleAudio();
    this.isMicOn = this.roomHubService.audioEnabled;
  }

  toggleVideo(): void {
    this.roomHubService.toggleVideo();
    this.isCameraOn = this.roomHubService.videoEnabled;
  }


  onResolutionChanged(resolution: { width: number; height: number }) {
    console.log(`🔧 Độ phân giải thay đổi: ${resolution.width}x${resolution.height}`);

    this.displayLocalStream(); // Cập nhật hiển thị stream cục bộ
    this.cdr.detectChanges(); // Buộc UI cập nhật
  }





  ngAfterViewInit() {
    // Gọi sau khi phần tử <video> đã render
    this.displayLocalStream();
  }
  private displayLocalStream(): void {
    const stream = this.roomHubService.getLocalStream();
    if (stream && this.localVideo) {
      this.localVideo.nativeElement.srcObject = null; // Reset video trước
      console.log("🎥 Track Video mới:", stream.getVideoTracks());

      setTimeout(() => {
        this.localVideo.nativeElement.srcObject = stream;
        this.localVideo.nativeElement.play().catch((err) => {
          console.error('❌ Lỗi khi phát video cục bộ:', err);
        });
      }, 100); // Tránh lỗi không cập nhật UI

      // Buộc cập nhật UI
      this.cdr.detectChanges();
    }
  }


  get audioEnabled(): boolean {
    return this.roomHubService.audioEnabled;
  }

  get videoEnabled(): boolean {
    return this.roomHubService.videoEnabled;
  }

  toggleScreenShare() {
    if (!this.isScreenSharing) {
      this.rtcHub.startScreenShare();
    } else {
      this.rtcHub.stopScreenShare();
    }
    this.isScreenSharing = !this.isScreenSharing;
  }

  pinUser(peer: Peer | null): void {
    if (!peer) return; // Nếu peer là null, thoát khỏi hàm

    if (this.pinnedUser?.userName === peer.userName) {
      // Nếu đã ghim user này thì bỏ ghim
      this.pinnedUser = null;
      this.isPinned = false;
    } else {
      // Ghim user mới
      this.pinnedUser = peer;
      this.isPinned = true;
    }
  }

  toggleRecordingModal(): void {
    console.log("Toggle recording modal clicked"); // Kiểm tra xem có chạy không
    this.isRecordingModalOpen = !this.isRecordingModalOpen;
  }


  toggleRecordWithAudio(): void {
    this.recordWithAudio = !this.recordWithAudio;
  }

  async startRecording(): Promise<void> {
    console.log("Start recording clicked");
    if (this.rtcHub) {
      console.log("Audio:", this.recordWithAudio);

      try {
        await this.rtcHub.startRecording(this.recordWithAudio);
        this.isRecording = this.rtcHub.isRecording;
        console.log("✅ Cập nhật isRecording:", this.isRecording);
      } catch (error) {
        console.error("❌ Lỗi khi bắt đầu quay:", error);
      }

    } else {
      console.error("rtcHub is not initialized");
    }
    this.isRecordingModalOpen = false;
  }

  async stopRecording(): Promise<void> {
    if (this.rtcHub) {
      try {
        await this.rtcHub.stopRecording();
        this.isRecording = this.rtcHub.isRecording; // Cập nhật sau khi stop hoàn tất
        console.log("✅ Cập nhật isRecording:", this.isRecording);
      } catch (error) {
        console.error("❌ Lỗi khi dừng quay:", error);
      }
    }
  }

  onEmotionSent(event: { type: string; userName: string; x: number; y: number }) {
    console.log('🔹 Full event received:', event);
    console.log('🔹 Current userId:', this.userId);
    console.log('🔹 Event userName:', event.userName);

    if (!event || !event.userName) {
        console.error('❌ Invalid emotion event received');
        return;
    }

    const displayName = event.userName === this.userId ? 'you' : event.userName;
    console.log(`👤 Display name resolved: ${displayName}`);

    const modifiedEvent = {
        ...event,
        userName: displayName
    };

    this.bubbles.push(modifiedEvent);
    console.log('💬 Updated bubbles:', this.bubbles);
    this.cdr.detectChanges();
    setTimeout(() => {
        this.bubbles = this.bubbles.filter(b => b !== modifiedEvent);
        console.log('🧹 Bubbles after timeout:', this.bubbles);
        this.cdr.detectChanges();
    }, 7000);
}


onRaiseHand(event: { userName: string }) {
  if (!event || !event.userName) {
      console.error("❌ Invalid raise hand event received:", event);
      return;
  }

  console.log(`🙋 ${event.userName} đã giơ tay ✋`);

  // Kiểm tra xem user đã giơ tay chưa, nếu chưa thì thêm vào
  if (!this.raisedHands.includes(event.userName)) {
      this.raisedHands.push(event.userName);
  }

  // Bắt buộc UI cập nhật
  this.cdr.detectChanges();
}

onLowerHand(event: { userName: string }) {
  if (!event || !event.userName) {
      console.error("❌ Invalid lower hand event received:", event);
      return;
  }

  console.log(`🙅 ${event.userName} đã hạ tay ✋`);

  // Loại bỏ user khỏi danh sách giơ tay nếu họ có trong danh sách
  const index = this.raisedHands.indexOf(event.userName);
  if (index !== -1) {
      this.raisedHands.splice(index, 1);
  }

  // Bắt buộc UI cập nhật
  this.cdr.detectChanges();
}

getIcon(type: string): string {
  switch (type) {
    case 'love': return 'fa-solid fa-heart';
    case 'haha': return 'fa-solid fa-face-laugh';
    case 'like': return 'fa-solid fa-thumbs-up';
    case 'wow': return 'fa-solid fa-face-surprise';
    case 'sad': return 'fa-solid fa-face-sad-tear';
    case 'angry': return 'fa-solid fa-face-angry';
    default: return '';
  }
}

}
