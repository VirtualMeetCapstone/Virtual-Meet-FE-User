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
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubePlayerComponent } from '../../Components/youtube-player/youtube-player.component';
import { isPlatformBrowser } from '@angular/common';
import { RtcHubService } from '../../Hub/rtc-hub/rtc-hub.service';
import { AuthService } from '../../services/auth-service/auth.service';
@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss',
})
export class RoomComponentComponent implements OnInit {
  @ViewChild(YoutubePlayerComponent) youtubeComponent!: YoutubePlayerComponent;
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  roomId: string = '';
  userId: string = '';
  userList: string[] = [];
  constructor(
    private rtcHubService: RtcHubService,
    private route: ActivatedRoute,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
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
  participants = [
    {
      name: 'Gấu',
      avatar:
        'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
      isMuted: false,
    },
    // {
    //   name: 'Mạnh Tường',
    //   avatar:
    //     'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
    //   isMuted: true,
    // },
    // {
    //   name: 'Trần Ngọc Chí',
    //   avatar:
    //     'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
    //   isMuted: false,
    // },
    // {
    //   name: 'Đức',
    //   avatar:
    //     'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
    //   isMuted: true,
    // },
    {
      name: 'Đức',
      avatar:
        'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
      isMuted: true,
    },
    {
      name: 'Đức',
      avatar:
        'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
      isMuted: true,
    },
    {
      name: 'Đức',
      avatar:
        'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg',
      isMuted: true,
    },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    // { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
  ];

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

      await this.roomHubService.joinRoom('User', this.roomId);
      this.initializeEventListeners();

      this.rtcHubService.onReceiveOffer(async (offer) => {
        await this.handleOffer(offer);
      });

      this.rtcHubService.onReceiveAnswer(async (answer) => {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      });

      this.rtcHubService.onReceiveCandidate(async (candidate) => {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });

      // Khi có user khác rời, chỉ xóa video của họ
      this.rtcHubService.onReceiveHangUp((userId) => {
        console.log(`🔴 User ${userId} đã thoát`);
        this.removeRemoteVideo(userId);
      });

      await this.startCall();
    } catch (err) {
      console.error('❌ Lỗi khởi tạo phòng:', err);
      this.connectionStatus = 'Connection failed';
    }
  }

  getVideoGridClass(): string {
    const userCount = this.participants.length;
    return `users-${Math.min(userCount, 12)}`;
  }
  getDisplayedParticipants() {
    const maxDisplay = 11;
    return this.participants.slice(0, maxDisplay);
  }

  getRemainingCount() {
    const maxDisplay = 11;
    return this.participants.length > maxDisplay
      ? this.participants.length - maxDisplay
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
  async handleOffer(offer: RTCSessionDescriptionInit) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.rtcHubService.sendAnswer(this.roomId, answer);
  }

  hangUp() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.localStream.getTracks().forEach((track) => track.stop());
    // Gửi sự kiện rời cuộc gọi với user ID của A
    this.rtcHubService.sendHangUp(this.roomId, this.userId); // <-- Truyền ID của user A

    // Xóa trạng thái của A
    localStorage.removeItem('isInCall');
  }

  removeRemoteVideo(userId: string) {
    if (this.remoteVideo && this.remoteVideo.nativeElement.srcObject) {
      const remoteStream = this.remoteVideo.nativeElement
        .srcObject as MediaStream;
      const tracks = remoteStream.getTracks();

      // Dừng tất cả track của user A
      tracks.forEach((track) => track.stop());

      // Xóa video nếu đó là của user A
      if (this.remoteVideo.nativeElement.dataset.userId === userId) {
        this.remoteVideo.nativeElement.srcObject = null;
      }
    }
  }

  async startCall() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.localVideo.nativeElement.srcObject = this.localStream;

      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' }, // Cloudflare STUN
          { urls: 'stun:stun.cloudflare.com:53' }, // Cloudflare STUN alternative
          { urls: 'turn:turn.cloudflare.com:3478?transport=udp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (UDP)
          { urls: 'turn:turn.cloudflare.com:53?transport=udp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (UDP alternative)
          { urls: 'turn:turn.cloudflare.com:3478?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (TCP)
          { urls: 'turn:turn.cloudflare.com:80?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (TCP alternative)
          { urls: 'turn:turn.cloudflare.com:5349?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (secure TCP)
          { urls: 'turns:turn.cloudflare.com:443?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' } // Cloudflare TURN (secure TCP)
        ]
      });



      this.localStream
        .getTracks()
        .forEach((track) =>
          this.peerConnection.addTrack(track, this.localStream)
        );

      this.peerConnection.ontrack = (event) => {
        this.remoteVideo.nativeElement.srcObject = event.streams[0];
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.rtcHubService.sendCandidate(this.roomId, event.candidate);
        }
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.rtcHubService.sendOffer(this.roomId, offer);
    } catch (err) {
      console.error('❌ Lỗi lấy quyền camera/mic:', err);
      alert('Bạn chưa cấp quyền camera/mic, vui lòng kiểm tra lại!');
    }
  }
  toggleMic() {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled; // Bật/tắt mic
      this.isMicOn = audioTrack.enabled;
    }
  }

  toggleCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isCameraOn = videoTrack.enabled;
    }
  }
}
