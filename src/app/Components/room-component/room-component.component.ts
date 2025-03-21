import {
  Component,
  ElementRef,
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
import { Router } from '@angular/router';
import { Peer } from '../../models/rtc/pere';
@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss',
})
export class RoomComponentComponent implements OnInit {
  @ViewChild(YoutubePlayerComponent) youtubeComponent!: YoutubePlayerComponent;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  roomId: string = '';
  userId: string = '';
  userList: string[] = [];
  user: any = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
    private rtcHub: RtcHubService,
    private injector: Injector,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.userId = authService.getUser()?.id;
  }
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
  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const roomId = params.get('roomId');
      if (roomId) {
        this.roomId = roomId;
        localStorage.setItem('roomId', this.roomId);
        console.log('📌 Room ID từ router:', this.roomId);
      }
    });

this

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
      await this.roomHubService.joinRoom(this.user?.name, this.roomId);
      console.log("name", this.user?.name);
      this.initializeEventListeners();

      this.roomHubService.participants$.subscribe(count => {
        this.participantCount = count;
      });

      this.rtcHub.peers$.subscribe(peers => {
        this.peers = peers;
      });

      this.displayLocalStream();

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
      this.router.navigate(['/home']).then(() => {
        window.location.reload();
      });
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


  private displayLocalStream(): void {
    const stream = this.roomHubService.getLocalStream();
    if (stream && this.localVideo) {
      this.localVideo.nativeElement.srcObject = stream;

      // Tắt mic và camera thông qua service để đồng bộ trạng thái
      if (this.roomHubService.audioEnabled) {
        this.roomHubService.toggleAudio();
      }
      if (this.roomHubService.videoEnabled) {
        this.roomHubService.toggleVideo();
      }

      // Cập nhật trạng thái hiển thị
      this.isMicOn = this.roomHubService.audioEnabled;
      this.isCameraOn = this.roomHubService.videoEnabled;
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

}
