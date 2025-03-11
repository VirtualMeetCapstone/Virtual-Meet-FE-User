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

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    console.log(`🏠 Đang ở phòng ${this.roomId}`);

    if (!this.roomId) {
      console.error("❌ Không có roomId!");
      return;
    }

}
}
