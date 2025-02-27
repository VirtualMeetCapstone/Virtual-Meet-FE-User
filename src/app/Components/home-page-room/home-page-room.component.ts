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
  messages: any[] = [];
  pageSize = 9;
  loading = true;
  totalRooms = 0;
  skip = 0;
  showModalDeleteRoom = false;
  showModalAddEditRoom = false;

  constructor(private roomService: RoomServicesService) {}

  ngOnInit(): void {
    this.getRoom();
  }
  getRoom() {
    this.roomService.getRooms(9, 0).subscribe((room: any) => {
      this.rooms = room.data;
      this.totalRooms = room.totalCount;
      console.log();
    });
  }
  openModalDeleteRoom(room: any) {
    this.roomToDelete = room;
    this.showModalDeleteRoom = true;
  }
  openModalAddroom() {
    this.showModalAddEditRoom = true;
  }
  closeModalDeleteRoom(event: any) {
    if (!event) {
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
    } else {
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
      this.skip = 0;
      this.rooms = [];
      this.getRoom();
    }
  }

  closeModalAddRoom(event: any) {
    if (!event) {
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
    } else {
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
      this.messages.push('Add room successful !!!');
      setTimeout(() => {
        this.messages = []; // Ẩn sau 3 giây
      }, 3000);
      this.skip = 0;
      this.rooms = [];
      this.getRoom();
    }
  }
  loadMoreRooms() {
    if (this.rooms.length >= this.totalRooms) {
      this.loading = false;
      return;
    }
    this.skip += this.pageSize;
    this.roomService
      .getRooms(this.pageSize, this.skip)
      .subscribe((room: any) => {
        this.rooms = [...this.rooms, ...room.data];

        if (this.rooms.length >= this.totalRooms) {
          this.loading = false;
        }
      });
  }
  openModalAddRoom() {
    this.showModalAddEditRoom = true;
  }
}
