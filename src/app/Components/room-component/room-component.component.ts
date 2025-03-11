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

  isChatOpen = false;

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    console.log(`🏠 Đang ở phòng ${this.roomId}`);

    if (!this.roomId) {
      console.error("❌ Không có roomId!");
      return;
    }

  }

 // Toggle trạng thái hoạt động YouTube
 toggleYouTubeActivity() {
  this.isYouTubeActive = !this.isYouTubeActive;
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

