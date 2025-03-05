import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AppConstants } from '../../../constant/AppConstants';
interface Media {
  url: string;
  type: number;
  thumbnailUrl?: string;
}

interface Room {
  id?: string;
  topic?: string;
  medias?: Media[];
  owner?: {
    name: string;
    picture?: {
      url: string;
      type: number;
      thumbnailUrl?: string;
    };
  };
  ownerId?: string;
}

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
})
export class RoomListComponent implements OnChanges {
  @Input() userId!: string; // Nhận userId từ MyProfileComponent
  rooms: Room[] = [];
  isRoomsLoading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && this.userId) {
      this.fetchRooms(this.userId);
    }
  }

  async fetchRooms(id: string) {
    this.isRoomsLoading = true;
    try {
      const response = await fetch(
        `${AppConstants.API_BASE_URL_HTTPS}/rooms/${id}/favourite`
      );
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      this.rooms = data.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      this.isRoomsLoading = false;
    }
  }
}
