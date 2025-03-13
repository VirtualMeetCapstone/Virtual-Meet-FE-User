import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubeService } from '../../services/youtube-service/youtube.service';

@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss'
})
export class RoomComponentComponent implements OnInit{
  roomId: string = '';  userList: string[] = [];
  constructor(private route: ActivatedRoute
    ,private roomHub: RoomHubService,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService
  ) {}
  isYouTubeActive = false; // Trạng thái của hoạt động YouTube
  isParticipantsOpen = false;
  isActivityModalOpen: boolean = false;
  isChatOpen = false;

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    console.log(`🏠 Đang ở phòng ${this.roomId}`);
    this.roomHubService.receiveShare((username: string) => {
      this.isYouTubeActive = true;
      console.log(`🔹 ${username} đang chia sẻ với bạn!`);
    });

    if (!this.roomId) {
      console.error("❌ Không có roomId!");
      return;
    }

  }

  // Hàm mở/đóng modal chọn hoạt động
  toggleActivityModal() {
    this.isActivityModalOpen = !this.isActivityModalOpen;
  }

  // Hàm đóng modal
  closeActivityModal() {
    this.isActivityModalOpen = false;
  }

  // Hàm chọn YouTube Together
  startYouTubeTogether() {
    this.isYouTubeActive = true;
    this.closeActivityModal();

    this.roomHubService
    .sendShare()
    .then(() => console.log('✅ Đã gửi sự kiện share'))
    .catch((err) => console.error('❌ Lỗi khi gửi sự kiện share:', err));

    if (this.isYouTubeActive) {
      setTimeout(() => {
        this._playerService.initializePlayer();
      }, 100); // Delay 100ms để đảm bảo DOM đã cập nhật
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

