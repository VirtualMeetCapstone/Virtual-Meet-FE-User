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
      await this.roomHubService.getRoomState();

      this.initializeEventListeners();

    } catch (err) {
      console.error('❌ Lỗi khởi tạo phòng:', err);
      this.connectionStatus = 'Connection failed';
    }
  };


  private initializeEventListeners(): void {
    this.roomHubService.receiveShare((username) => {
      this.isYouTubeActive = true;
      this.restoreVideo();
    });

    this.roomHubService.onVideoSelected((roomId, videoId, time, isPaused) => {
      this._playerService.initializePlayer(videoId, time, isPaused);
    });
  }

  restoreVideo() {
    // Nhận video khi BE gửi lại
    this.roomHubService.onVideoSelected((roomId, videoId, time, isPaused) => {
      this.isYouTubeActive = true;
      setTimeout(() => {
        this._playerService.initializePlayer(videoId, time, isPaused);
      }, 300);
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

    if (this.isYouTubeActive) {
      setTimeout(() => {
        this.restoreVideo();
      }, 100);
    }
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
