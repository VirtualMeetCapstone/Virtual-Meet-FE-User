import { Injectable } from '@angular/core';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
declare var YT: any;

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private player: any;
  private lastStatus: number | null = null;
  private isUpdating = false; // Cờ kiểm soát vòng lặp

  constructor(private roomHub: RoomHubService) {
    this.roomHub
      .startConnection()
      .then(() => {
        console.log('🔥 SignalR sẵn sàng');

        // Đăng ký lắng nghe sự kiện từ SignalR
        this.roomHub.onPlayerStatusReceived((roomId, status, time) => {
          console.log(`📡 Nhận trạng thái từ tab khác: ${status}, thời gian: ${time}s`);
          this.updatePlayerFromSignalR(roomId, status, time);
        });
      })
      .catch((err) => console.error('❌ Lỗi khi kết nối SignalR: ', err));
  }



  initializePlayer(videoId: string = '',time: number=0, isPaused: boolean = true) {
    console.log("🎬 Thiết lập video:", videoId);

    if ((window as any).YT && (window as any).YT.Player) {
      this.updateVideo(videoId,time,isPaused);
      return;
    }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      this.createPlayer(videoId,time,isPaused);
    };
  }

  private createPlayer(videoId: string, time: number = 0, isPaused: boolean = true) {
    // Nếu videoId rỗng hoặc null, đặt video mặc định
    const defaultVideoId = "dQw4w9WgXcQ"; // Thay bằng video mặc định của bạn
    videoId = videoId?.trim() || defaultVideoId;

    this.player = new YT.Player('player', {
      height: '400',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: isPaused ? 0 : 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },

      events: {
        onReady: (event: any) => {
          console.log("✅ Player đã sẵn sàng, nhảy tới:", time);
          event.target.seekTo(time, true);
          if (isPaused) {
            event.target.pauseVideo();
          } else {
            event.target.playVideo();
          }
        },
        onStateChange: this.onPlayerStateChange.bind(this),
      },
    });
}

  private updateVideo(videoId: string, time: number=0, isPaused: boolean = true) {
    if (this.player && typeof this.player.loadVideoById === 'function') {
      console.log("🔄 Đổi video:", videoId);
      this.player.loadVideoById(videoId);
      this.player.seekTo(time,true);
      if (isPaused) {
        this.player.pauseVideo();
      } else {
        this.player.playVideo();
      }
    } else {
      console.warn("⚠️ Player chưa sẵn sàng, thử lại sau...");
      setTimeout(() => this.updateVideo(videoId,time,isPaused), 500);
    }
  }


  private onPlayerStateChange(event: any) {
    console.log(
      `🎬 Player State Changed: ${event.data} | isUpdating: ${this.isUpdating}`
    );

    if (this.isUpdating) {
      console.log('🔄 Đang cập nhật từ SignalR, bỏ qua gửi trạng thái...');
      return;
    }

    // Gửi tất cả trạng thái (PLAYING, PAUSED, BUFFERING)
    if (
      event.data === YT.PlayerState.PLAYING ||
      event.data === YT.PlayerState.PAUSED ||
      event.data === YT.PlayerState.BUFFERING
    ) {
      const roomId = this.roomHub.currentUser.roomId; // Lấy roomId từ RoomHubService
      if (!roomId) {
        console.warn('⚠️ Không tìm thấy roomId, không thể gửi trạng thái.');
        return;
      }

      console.log(`📤 Gửi trạng thái lên server: ${event.data}`);
       this.roomHub.sendPlayerStatus(roomId,event.data, this.player.getCurrentTime());
    }

    this.lastStatus = event.data;
  }

  private updatePlayerFromSignalR(roomId: string, status: number, time: number) {
    if (!this.player || typeof this.player.getPlayerState !== 'function') {
      console.warn('⏳ Player chưa sẵn sàng, thử lại sau...');
      setTimeout(() => this.updatePlayerFromSignalR(roomId, status, time), 500);
      return;
    }

    this.isUpdating = true; // 🚀 Đánh dấu đang cập nhật từ SignalR

    console.log(
      `▶️ Cập nhật Player từ SignalR: ${
        status === YT.PlayerState.PLAYING ? 'Play' : 'Pause'
      } tại ${time}s`
    );

    this.player.seekTo(time, true);

    if (status === YT.PlayerState.PLAYING) {
      this.player.mute(); // Tắt âm thanh giúp tránh bị chặn autoplay
      this.player.playVideo();
      setTimeout(() => this.player.unMute(), 500); // Bật lại âm sau 500ms
    }


    // ✅ Reset lại cờ sau khi player thực sự thay đổi trạng thái
    setTimeout(() => {
      this.isUpdating = false;
      console.log(
        '✅ Hoàn tất cập nhật từ SignalR, có thể gửi trạng thái mới.'
      );
    }, 1000);
  }


  cueVideoById(videoId: string) {
    this.player?.cueVideoById(videoId);
  }

  loadVideoById(videoId: string) {
    this.player?.loadVideoById(videoId);
  }

  changePlayerStatus(status: number, time: number) {
    if (!this.player || typeof this.player.getPlayerState !== 'function') {
      console.warn('⏳ Player chưa sẵn sàng, thử lại sau...');
      setTimeout(() => this.changePlayerStatus(status, time), 500);
      return;
    }

    this.player.seekTo(time, true);
    if (status === YT.PlayerState.PLAYING) this.player.playVideo();
    else if (status === YT.PlayerState.PAUSED) this.player.pauseVideo();

    console.log(
      `▶️ Cập nhật Player: ${
        status === YT.PlayerState.PLAYING ? 'Play' : 'Pause'
      } tại ${time}s`
    );
  }

  pauseVideo() {
    if (this.player) {
      this.player.pauseVideo();
    }
  }

}
