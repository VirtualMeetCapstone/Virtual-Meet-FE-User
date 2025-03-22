import {
  Component,
  OnInit,
  Input,
  Inject,
  PLATFORM_ID,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubeService } from '../../services/youtube-service/youtube.service';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { isPlatformBrowser } from '@angular/common';
declare var YT: any;

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss'],
})
export class YoutubePlayerComponent implements OnInit {
  @ViewChild('videoContainer', { static: false }) videoContainer!: ElementRef;

  ngAfterViewInit() {
    this.videoContainer.nativeElement.addEventListener('scroll', () => this.onScroll());
  }
  onScroll(): void {
    const container = this.videoContainer.nativeElement;
    const pos = container.scrollTop + container.clientHeight;
    const max = container.scrollHeight;

    if (pos >= max - 200 && !this.isLoading) {
      this.loadTrendingVideos();
    }
  }

  @Input() roomId: string = '';
  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
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
  nextPageToken: string = '';
  isLoading: boolean = false;
  ngOnInit() {
    this._roomHub.onPlayerStatusReceived((roomId, status, time) => {
      this._playerService.changePlayerStatus(status, time);
    });

    this._roomHub.onVideoSelected((roomId, videoId) => {
      console.log(`🎬 Nhận video từ Hub - Room: ${roomId}, Video: ${videoId}`);
      this.playVideo(videoId);
    });

    this.loadTrendingVideos();
  }

  IsDevelop() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadYouTubeAPI()
        .then(() => {
          this.initializePlayer();
        })
        .catch((err) => {
          console.error('❌ Lỗi tải YouTube API:', err);
        });
    }
  }
  IsDevelop2() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadYouTubeAPI()
        .then(() => {
          this._playerService.initializePlayer();
        })
        .catch((err) => {
          console.error('❌ Lỗi tải YouTube API:', err);
        });
    }
  }
  private loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        console.warn('🚫 Không thể tải YouTube API trên server');
        resolve();
        return;
      }

      if ((window as any).YT && (window as any).YT.Player) {
        console.log('✅ YouTube API đã có sẵn');
        resolve();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onload = () => {
        console.log('✅ YouTube API đã tải xong');
        resolve();
      };
      tag.onerror = () => reject('Không thể tải YouTube API');

      document.body.appendChild(tag);
    });
  }

  private initializePlayer() {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('🚫 Không thể khởi tạo Player trên server');
      return;
    }

    if (!(window as any).YT || !(window as any).YT.Player) {
      console.error('❌ YouTube API chưa sẵn sàng');
      return;
    }

    this.player = new YT.Player('player', {
      height: '400',
      width: '100%',
      videoId: 'rEsc9tb_Y6I',
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => console.log('✅ Player sẵn sàng'),
      },
    });
  }

  public selectVideo(videoId: string): void {
    this.playVideo(videoId);
    console.log(this.roomId);
    this._roomHub.selectVideo(this.roomId, videoId);
  }

  searchVideos(): void {
    this.youtubeService.searchVideos(this.searchQuery).subscribe((response) => {
      this.videos = response.items;
    });
  }

  loadTrendingVideos(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.youtubeService
      .getTrendingVideos(this.nextPageToken)
      .subscribe((response) => {
        this.videos = [...this.videos, ...response.items];
        this.nextPageToken = response.nextPageToken;
        this.isLoading = false;
      });
  }

  playVideo(videoId: string) {
    this._playerService.loadVideoById(videoId);
  }
}
