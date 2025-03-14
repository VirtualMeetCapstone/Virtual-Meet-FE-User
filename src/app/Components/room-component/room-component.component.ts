import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubePlayerComponent } from '../../Components/youtube-player/youtube-player.component';

@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss'
})

export class RoomComponentComponent implements OnInit{
  @ViewChild(YoutubePlayerComponent) youtubeComponent!: YoutubePlayerComponent;
  roomId: string = '';  userList: string[] = [];
  constructor(private route: ActivatedRoute,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
    private injector: Injector
  ) {}
  isYouTubeActive = false; // Trạng thái của hoạt động YouTube
  isParticipantsOpen = false;
  isActivityModalOpen: boolean = false;
  isChatOpen = false;

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    console.log(`🏠 Đang vào phòng ${this.roomId}`);

    if (!this.roomId) {
      console.error("❌ Không có roomId!");
      return;
    }

    // Tham gia phòng
    this.roomHubService.joinRoom("User B", this.roomId)
      .then(() => {
        console.log("✅ Đã tham gia phòng, yêu cầu trạng thái phòng...",  this.roomHubService.getRoomState());
        return this.roomHubService.getRoomState(); // 🔥 GỌI API LẤY TRẠNG THÁI
      })
      .catch(err => console.error('❌ Lỗi khi tham gia phòng:', err));

    // Nhận sự kiện share
    this.roomHubService.receiveShare((username: string) => {
      this.isYouTubeActive = true;

      this.restoreVideo();

    });

  }

  restoreVideo(){
      // Nhận video khi BE gửi lại
      this.roomHubService.onVideoSelected((roomId, videoId,time,isPaused) => {
        console.log(`📺 Nhận lại video ${videoId}`);
        console.log(`📺 Nhận lại time ${time}`);
        this._playerService.initializePlayer(videoId,time,isPaused);
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

    this.isYouTubeActive = false; // Ẩn YouTube trên giao diện của A
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
  toggleClose()
  {
    this.isChatOpen = false;
    this.isParticipantsOpen = false;
  }


}

