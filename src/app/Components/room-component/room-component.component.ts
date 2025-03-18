import { Component, Inject, Injector, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubePlayerComponent } from '../../Components/youtube-player/youtube-player.component';
import { isPlatformBrowser } from '@angular/common';
@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss',
})
export class RoomComponentComponent implements OnInit {
  @ViewChild(YoutubePlayerComponent) youtubeComponent!: YoutubePlayerComponent;
  roomId: string = '';
  userList: string[] = [];
  constructor(
    private route: ActivatedRoute,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
    private injector: Injector,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}
  isYouTubeActive = false; // Trạng thái của hoạt động YouTube
  isParticipantsOpen = false;
  isActivityModalOpen: boolean = false;
  isChatOpen = false;
  roomState: any; // Thêm biến lưu trạng thái
  connectionStatus: string = 'Connecting...';
  participants = [
    { name: 'Gấu', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: false },
    { name: 'Mạnh Tường', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    { name: 'Trần Ngọc Chí', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: false },
    { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
    { name: 'Đức', avatar: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/17/avatar-5-16712397387431162229796.jpeg', isMuted: true },
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
        this._playerService.initializePlayer(state.videoId, state.time, state.isPaused);
      }
    });

      await this.roomHubService.joinRoom('User', this.roomId);
      this.initializeEventListeners();

    } catch (err) {
      console.error('❌ Lỗi khởi tạo phòng:', err);
      this.connectionStatus = 'Connection failed';
    }
  };

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
    return this.participants.length > maxDisplay ? this.participants.length - maxDisplay : 0;
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
}
