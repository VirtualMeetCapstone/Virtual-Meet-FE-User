import { Injectable } from '@angular/core';
import { VideoHub } from '../../Hub/video-hub/video.hub';
declare var YT: any;

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private player: any;
  private lastStatus: number | null = null;
  private isUpdating = false; // Cờ kiểm soát vòng lặp

  constructor(private videoSyncService: VideoHub) {
    this.initializePlayer();

    this.videoSyncService.startConnection()
      .then(() => {
        console.log("🔥 SignalR sẵn sàng");
        this.videoSyncService.onPlayerStatusReceived((status, time) => {
          console.log(`📡 Nhận trạng thái từ tab khác: ${status}, thời gian: ${time}s`);
          this.updatePlayerFromSignalR(status, time);
        });
      })
      .catch(err => console.error("❌ Lỗi khi kết nối SignalR: ", err));
  }

  initializePlayer() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player('player', {
        height: '400',
        width: '100%',
        events: {
          'onStateChange': this.onPlayerStateChange.bind(this)
        }
      });
    };
    console.log("thanh cong yt")
  }

  private onPlayerStateChange(event: any) {
    console.log(`🎬 Player State Changed: ${event.data} | isUpdating: ${this.isUpdating}`);

    if (this.isUpdating) {
      console.log("🔄 Đang cập nhật từ SignalR, bỏ qua gửi trạng thái...");
      return;
    }

    // Gửi tất cả trạng thái (PLAYING, PAUSED, BUFFERING)
    if (event.data === YT.PlayerState.PLAYING ||
        event.data === YT.PlayerState.PAUSED ||
        event.data === YT.PlayerState.BUFFERING) {
      console.log(`📤 Gửi trạng thái lên server: ${event.data}`);
      this.videoSyncService.sendPlayerStatus(event.data, this.player.getCurrentTime());
    }

    this.lastStatus = event.data;
  }

  private updatePlayerFromSignalR(status: number, time: number) {
    if (!this.player || typeof this.player.getPlayerState !== 'function') {
      console.warn("⏳ Player chưa sẵn sàng, thử lại sau...");
      setTimeout(() => this.updatePlayerFromSignalR(status, time), 500);
      return;
    }

    this.isUpdating = true; // 🚀 Đánh dấu đang cập nhật từ SignalR
    console.log(`▶️ Cập nhật Player từ SignalR: ${status === YT.PlayerState.PLAYING ? 'Play' : 'Pause'} tại ${time}s`);

    this.player.seekTo(time, true);

    if (status === YT.PlayerState.PLAYING) {
      this.player.playVideo();
    } else if (status === YT.PlayerState.PAUSED) {
      this.player.pauseVideo();
    }

    // ✅ Reset lại cờ sau khi player thực sự thay đổi trạng thái
    setTimeout(() => {
      this.isUpdating = false;
      console.log("✅ Hoàn tất cập nhật từ SignalR, có thể gửi trạng thái mới.");
    }, 1000); // Đợi 1 giây để đảm bảo player đã nhận trạng thái mới
  }


  cueVideoById(videoId: string) {
    this.player?.cueVideoById(videoId);
  }

  changePlayerStatus(status: number, time: number) {
    if (!this.player || typeof this.player.getPlayerState !== 'function') {
      console.warn("⏳ Player chưa sẵn sàng, thử lại sau...");
      setTimeout(() => this.changePlayerStatus(status, time), 500);
      return;
    }

    this.player.seekTo(time, true);
    if (status === YT.PlayerState.PLAYING) this.player.playVideo();
    else if (status === YT.PlayerState.PAUSED) this.player.pauseVideo();

    console.log(`▶️ Cập nhật Player: ${status === YT.PlayerState.PLAYING ? 'Play' : 'Pause'} tại ${time}s`);
  }
}
