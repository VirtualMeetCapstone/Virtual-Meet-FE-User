import { Component, OnInit, Input } from '@angular/core';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubeService } from '../../services/youtube-service/youtube.service';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
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
    private _roomHub: RoomHubService
  ) {}

  //init

  showWhiteboard = false;
  showVideoSelection = false;
  videos: any[] = [];
  searchQuery = '';


  ngOnInit() {
    this._roomHub.startSignalRConnection();
    this._roomHub.onPlayerStatusReceived((roomId,status, time) => {
      this._playerService.changePlayerStatus(status, time);
    });
    this._roomHub.onVideoSelected((roomId, videoId) => {
      console.log(`🎬 Nhận video từ Hub - Room: ${roomId}, Video: ${videoId}`);
      this.playVideo(videoId); // Phát video nhận được
  });

    this.loadTrendingVideos();
  }



 public selectVideo(videoId: string): void {
    this.playVideo(videoId);
    console.log(this.roomId)
    this._roomHub.selectVideo(this.roomId,videoId);
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
    this._playerService.loadVideoById(videoId);
    this._roomHub.sendPlayerStatus(this.roomId,YT.PlayerState.PLAYING, 0);
  }
}
