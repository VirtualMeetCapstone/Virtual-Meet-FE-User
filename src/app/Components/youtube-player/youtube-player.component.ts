import { Component, OnInit, Input } from '@angular/core';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { YoutubeService } from '../../services/youtube-service/youtube.service';
declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss'],
})
export class YoutubePlayerComponent implements OnInit {
  @Input() roomId: string = '';
  constructor(
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
    private youtubeService: YoutubeService
  ) {}

  //init
  showActivityMenu = false;
  showWhiteboard = false;
  showVideoSelection = false;
  videos: any[] = [];
  searchQuery = '';


  ngOnInit() {
    console.log('🔹youtube Room ID nhận được:', this.roomId);
    this.roomHubService.startConnection();
    // Nhận sự kiện popup state từ server

    // Nhận sự kiện share từ server
    this.roomHubService.receiveShare((username: string) => {
      this.showVideoSelection = true;
      console.log(`🔹 ${username} đang chia sẻ với bạn!`);
    });


    this.loadTrendingVideos();
  }

  toggleActivityMenu(): void {
    this.showActivityMenu = !this.showActivityMenu;
  }

  // Bắt đầu sử dụng Whiteboard
  startWhiteboard(): void {
    this.showWhiteboard = true;
    this.showVideoSelection = false;
  }

  startVideoSharing(): void {
    console.log('🔹 Bắt đầu chia sẻ video');
    console.log(`📢 Gửi togglePopup(true) cho roomId: ${this.roomId}`);
    this.showVideoSelection = true;
    // Gửi sự kiện share đến server
    this.roomHubService
      .sendShare()
      .then(() => console.log('✅ Đã gửi sự kiện share'))
      .catch((err) => console.error('❌ Lỗi khi gửi sự kiện share:', err));

      if (this.showVideoSelection) {
        setTimeout(() => {
          this._playerService.initializePlayer();
        }, 100); // Delay 100ms để đảm bảo DOM đã cập nhật
      }
  }


  searchVideos(): void {
    this.youtubeService.searchVideos(this.searchQuery).subscribe((response) => {
      this.videos = response.items;
    });
  }

  loadTrendingVideos(): void {
    this.youtubeService.getTrendingVideos().subscribe((response) => {
      this.videos = response.items;
    });
  }

  selectVideo(videoId: string): void {
    this.playVideo(videoId);
  }

  playVideo(videoId: string) {
    this._playerService.cueVideoById(videoId);
  }
}
