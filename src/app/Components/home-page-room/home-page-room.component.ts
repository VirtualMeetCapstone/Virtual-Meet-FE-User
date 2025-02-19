import { Component, OnInit } from '@angular/core';
import { RoomServicesService } from '../../services/room-services.service';

@Component({
  selector: 'app-home-page-room',
  templateUrl: './home-page-room.component.html',
  styleUrl: './home-page-room.component.scss',
})
export class HomePageRoomComponent implements OnInit {
  rooms: any[] = [];
  allRooms: any[] = []; // Dữ liệu gốc
  pageSize = 9;
  currentPage = 0;
  constructor(private roomService: RoomServicesService) {}

  ngOnInit(): void {
    this.loadAllRooms(); // Tải toàn bộ dữ liệu từ API
    console.log('room', this.rooms);
  }

  loadAllRooms() {
    this.roomService.getRooms().subscribe((data: any) => {
      this.allRooms = [...data.data, ...data.data, ...data.data];
      this.loadMoreRooms(); // Hiển thị 10 phòng đầu tiên
    });
  }

  loadMoreRooms() {
    const nextRooms = this.allRooms.slice(
      this.currentPage * this.pageSize,
      (this.currentPage + 1) * this.pageSize
    );
    this.rooms.push(...nextRooms);
    this.currentPage++;
  }
}
