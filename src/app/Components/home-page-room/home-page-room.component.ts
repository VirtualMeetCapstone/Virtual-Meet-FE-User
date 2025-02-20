import { Component, OnInit } from '@angular/core';
import { RoomServicesService } from '../../services/room-services.service';

@Component({
  selector: 'app-home-page-room',
  templateUrl: './home-page-room.component.html',
  styleUrl: './home-page-room.component.scss',
})
export class HomePageRoomComponent implements OnInit {
  roomToDelete: any = null;
  rooms: any[] = [];
  pageSize = 9;
  loading = true;
  totalRooms = 0;
  skip = 0;
  showModalDeleteRoom = false;

  constructor(private roomService: RoomServicesService) {}

  ngOnInit(): void {
    this.getRoom();
  }
  getRoom() {
    this.roomService.getRooms(9, 0).subscribe((room: any) => {
      this.rooms = room.data;
      this.totalRooms = room.totalCount;
    });
  }
  openModalDeleteRoom(room: any) {
    this.roomToDelete = room;
    this.showModalDeleteRoom = true;
  }
  closeModalDeleteRoom(event: any) {
    if (!event) {
      this.showModalDeleteRoom = false;
    } else {
      this.showModalDeleteRoom = false;
      this.skip = 0;
      this.rooms = [];
      this.getRoom();
    }
  }

  loadMoreRooms() {
    if (this.totalRooms == this.rooms.length) {
      this.loading = false;
      return;
    }
    this.roomService
      .getRooms(this.pageSize, this.skip)
      .subscribe((room: any) => {
        this.skip = this.skip + this.pageSize;
        this.rooms.push(...room.data);
      });
  }
}
