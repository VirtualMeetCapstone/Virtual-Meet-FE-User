import { Component, AfterViewInit } from '@angular/core';
import { YoutubeService } from '../../services/youtube-service/youtube.service';
import { HubService } from '../../services/hub-service/hub.service';

declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss'],
})
export class YoutubePlayerComponent implements AfterViewInit {
  player: any;
  videoStatus = 'Đang tải...';
  videos: any[] = [];
  searchQuery = '';
  showVideoSelection = false;
  showActivityMenu = false;
  showWhiteboard = false;

  isTabA = false;

  constructor(
    private youtubeService: YoutubeService,
    private hubService: HubService
  ) {}

  ngAfterViewInit(): void {
    this.loadTrendingVideos();
    this.initYoutubeAPI();
    this.listenToVideoUpdates();
    this.listenToPopupState();
  }

  private initYoutubeAPI(): void {
    this.youtubeService.loadYoutubeApi().then(() => {
      setTimeout(() => {
        this.initPlayer('M7lc1UVf-VE');
      }, 1000);
    });
  }

  private initPlayer(videoId: string): void {
    // Nếu player đã được khởi tạo rồi, không khởi tạo lại
    if (this.player && typeof this.player.loadVideoById === 'function') {
      this.player.loadVideoById(videoId);
      console.log('Đã có player');
      return;
    }

    // Nếu chưa khởi tạo, tạo mới player
    this.player = new YT.Player('youtubePlayer', {
      height: '360',
      width: '640',
      videoId,
      playerVars: { playsinline: 1 },
      events: {
        onReady: (event: any) => {
          console.log('YouTube Player đã sẵn sàng');
          this.onPlayerReady(event);
        },
        onStateChange: (event: any) => this.onPlayerStateChange(event),
      },
    });
  }

  private onPlayerReady(event: any): void {
    console.log('Player is ready, safe to make API calls');
    if (this.isTabA) {
      this.player.playVideo();
    }
  }

  private onPlayerStateChange(event: any): void {
    // Kiểm tra nếu player chưa được khởi tạo
    if (!this.player || typeof this.player.playVideo !== 'function') {
      console.error(
        'YouTube player is not initialized or does not have playVideo method'
      );
      return;
    }

    // Chuyển trạng thái video qua SignalR
    const timestamp = this.player.getCurrentTime();
    const isPaused = event.data === YT.PlayerState.PAUSED;

    if (this.isTabA) {
      this.hubService.changeVideo(
        this.player.getVideoData().video_id,
        timestamp,
        isPaused
      );
    }
  }

  private listenToVideoUpdates(): void {
    this.hubService.getVideoUpdates().subscribe((videoState) => {
      console.log('Received video update:', videoState);

      this.initPlayer(videoState.videoId);
      this.handleVideoUpdate(videoState);
    });
  }

  private handleVideoUpdate(videoState: any): void {
    // Lấy dữ liệu video hiện tại
    const currentVideoData = this.player.getVideoData;
    console.log('Current video data:', currentVideoData);
    if (currentVideoData.video_id !== videoState.videoId) {
      this.initPlayer(videoState.videoId);
    }

    // Đồng bộ trạng thái play/pause
    if (
      videoState.isPaused !==
      (this.player.getPlayerState() === YT.PlayerState.PAUSED)
    ) {
      if (videoState.isPaused) {
        this.player.pauseVideo(); // Pause video nếu là paused
      } else {
        this.player.playVideo(); // Play video nếu không phải paused
      }
      this.player.seekTo(videoState.timestamp);
    }
  }

  private listenToPopupState(): void {
    this.hubService.getPopupState().subscribe((isOpen) => {
      this.showVideoSelection = isOpen; // Điều chỉnh trạng thái popup video
    });
  }

  startVideoSharing(): void {
    console.log('Bắt đầu chia sẻ video');
    this.isTabA = true; // Chuyển thành tab A
    this.showVideoSelection = true;
    this.showWhiteboard = false;

    this.hubService.togglePopup(true); // Mở popup cho tất cả các client khác
    this.hubService.changeVideo('M7lc1UVf-VE'); // Đặt video mặc định
  }

  loadTrendingVideos(): void {
    this.youtubeService.getTrendingVideos().subscribe((response) => {
      this.videos = response.items;
    });
  }

  searchVideos(): void {
    this.youtubeService.searchVideos(this.searchQuery).subscribe((response) => {
      this.videos = response.items;
    });
  }

  selectVideo(videoId: string): void {
    if (this.isTabA) this.initPlayer(videoId);
  }

  toggleVideoSelection(): void {
    this.showVideoSelection = !this.showVideoSelection;
  }

  // Mở/Đóng menu chọn hoạt động
  toggleActivityMenu(): void {
    this.showActivityMenu = !this.showActivityMenu;
  }

  // Bắt đầu sử dụng Whiteboard
  startWhiteboard(): void {
    this.showWhiteboard = true;
    this.showVideoSelection = false;
  }
}
