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
  private player: any;
  showWhiteboard = false;
  showVideoSelection = false;
  videos: any[] = [];
  searchQuery = '';


  ngOnInit() {
    this._roomHub.startConnection();
   // Kiểm tra YouTube Player đã khởi tạo chưa trước khi init

    this._playerService.initializePlayer();

this.loadYouTubeAPI().then(() => {
  this.initializePlayer();
}).catch(err => {
  console.error("❌ Lỗi tải YouTube API:", err);
});

    this._roomHub.onPlayerStatusReceived((roomId,status, time) => {
      this._playerService.changePlayerStatus(status, time);
    });
    this._roomHub.onVideoSelected((roomId, videoId) => {
      console.log(`🎬 Nhận video từ Hub - Room: ${roomId}, Video: ${videoId}`);
      this.playVideo(videoId); // Phát video nhận được
  });

    this.loadTrendingVideos();
  }


  private loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).YT && (window as any).YT.Player) {
            console.log("✅ YouTube API đã có sẵn");
            resolve();
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.onload = () => {
            console.log("✅ YouTube API đã tải xong");
            resolve();
        };
        tag.onerror = () => reject("Không thể tải YouTube API");

        document.body.appendChild(tag);
    });
}

private initializePlayer() {
    if (!(window as any).YT || !(window as any).YT.Player) {
        console.error("❌ YouTube API chưa sẵn sàng");
        return;
    }

    this.player = new YT.Player('player', {
        height: '400',
        width: '100%',
        videoId: 'Ec7zLUi16JU',
        playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
        },
        events: {
            onReady: () => console.log("✅ Player sẵn sàng"),
        }
    });
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
