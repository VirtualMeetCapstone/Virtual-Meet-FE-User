import { Component, OnInit, Input } from '@angular/core';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubeService } from '../../services/youtube-service/youtube.service';
import { VideoHubService } from '../../Hub/video-hub/video-hub.service';
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
    private youtubeService: YoutubeService,
    private _videoHub: VideoHubService
  ) {}

  //init

  showWhiteboard = false;
  showVideoSelection = false;
  videos: any[] = [];
  searchQuery = '';


  ngOnInit() {
    this._videoHub.startConnection();
    this._videoHub.onPlayerStatusReceived((status, time) => {
      this._playerService.changePlayerStatus(status, time);
    });
    // Nhận video đã chọn từ Hub
    this._videoHub.onVideoSelected((videoId) => {
      console.log(`🎬 Nhận video từ Hub: ${videoId}`);
      this.playVideo(videoId); // Phát video nhận được
    });

    this.loadTrendingVideos();
  }



  selectVideo(videoId: string): void {
    this.playVideo(videoId);
    console.log(this.roomId)
    this._videoHub.selectVideo(videoId);
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


  playVideo(videoId: string) {
    this._playerService.cueVideoById(videoId);
    this._videoHub.sendPlayerStatus(YT.PlayerState.PLAYING, 0);
  }
}
