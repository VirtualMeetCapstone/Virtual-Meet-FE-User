import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';

@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss'
})
export class RoomComponentComponent implements OnInit{
  roomId: string = '';  userList: string[] = [];
  constructor(private route: ActivatedRoute
    ,private roomHub: RoomHubService
  ) {}
  isYouTubeActive = false; // Trạng thái của hoạt động YouTube
  isParticipantsOpen = false;
  isActivityModalOpen: boolean = false;
  isChatOpen = false;

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    console.log(`🏠 Đang ở phòng ${this.roomId}`);

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
    // Thực hiện thêm logic khi chọn YouTube Together (ví dụ: phát video YouTube)
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

