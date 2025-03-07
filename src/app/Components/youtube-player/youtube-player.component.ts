import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../../youtubeplayer-service/player.service';
import { VideoService } from '../../video-service/video.service';
import { YoutubeService } from '../../services/youtube-service/youtube.service';
declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss'],
})
export class YoutubePlayerComponent implements OnInit {
  constructor(
    private _playerService: PlayerService,
    private _videoHub: VideoService,
    private youtubeService: YoutubeService
  ) {}

  //init
  showActivityMenu = false;
  showWhiteboard = false;
  showVideoSelection = false;
  videos: any[] = [];
  searchQuery = '';

  ngOnInit() {
    this._videoHub.startConnection();
    this._videoHub.onPlayerStatusReceived((status, time) => {
      this._playerService.changePlayerStatus(status, time);
    });
    // Nhận sự kiện popup state từ server
    this.listenToPopupState();
    // Nhận video đã chọn từ Hub
    this._videoHub.onVideoSelected((videoId) => {
      console.log(`🎬 Nhận video từ Hub: ${videoId}`);
      this.playVideo(videoId); // Phát video nhận được
    });

    this.loadTrendingVideos();
  }

  playVideo(videoId: string) {
    this._playerService.cueVideoById(videoId);
    this._videoHub.sendPlayerStatus(YT.PlayerState.PLAYING, 0);
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
    console.log('Bắt đầu chia sẻ video');
    this.showVideoSelection = true;
    this.showWhiteboard = false;
    //VideoService --> hub
    this._videoHub.togglePopup(true);

    this._playerService.initializePlayer();

    if (this.showVideoSelection) {
      setTimeout(() => {
        this._playerService.initializePlayer();
      }, 100); // Delay 100ms để đảm bảo DOM đã cập nhật
    }
    // this._videoHub.changeVideo('M7lc1UVf-VE'); // Đặt video mặc định
  }

  private listenToPopupState(): void {
    this._videoHub.getPopupState().subscribe((isOpen) => {
      this.showVideoSelection = isOpen; // Điều chỉnh trạng thái popup video
    });
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
    this._videoHub.selectVideo(videoId);
  }
}
