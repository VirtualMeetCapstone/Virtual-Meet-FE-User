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


// Thêm các biến mới
private isExternalUpdate = false;
private lastSyncedTime = 0;
private lastSyncedStatus: number | null = null;
private syncThreshold = 1.5; // Ngưỡng chênh lệch thời gian (giây)

  constructor(private roomHub: RoomHubService) {
    this.roomHub
      .startSignalRConnection()
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
       // Xử lý autoplay policy
       if (!isPaused) {
        event.target.mute();
        event.target.playVideo();
        setTimeout(() => event.target.unMute(), 500);
      }
        },
        onStateChange: this.onPlayerStateChange.bind(this),
      },
    });
}

private updateVideo(videoId: string, time: number = 0, isPaused: boolean = true) {
  if (this.player) {
    try {
      this.isExternalUpdate = true;

      // Sử dụng loadVideoById với tham số startSeconds
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: time,
        suggestedQuality: 'default'
      });

      // Bật/tắt tiếng để xử lý autoplay policy
      this.player.mute();
      if (!isPaused) {
        this.player.playVideo();
        setTimeout(() => this.player.unMute(), 500);
      }

      this.lastSyncedTime = time;
      this.lastSyncedStatus = isPaused ? YT.PlayerState.PAUSED : YT.PlayerState.PLAYING;

    } finally {
      setTimeout(() => {
        this.isExternalUpdate = false;
      }, 1000);
    }
  }
}
  private onPlayerStateChange(event: any) {
    console.log(`🎬 Player State Changed: ${event.data}`);

    // Bỏ qua nếu là cập nhật từ hệ thống
    if (this.isExternalUpdate) return;

    const currentStatus = event.data;
    const currentTime = this.player.getCurrentTime();

    // Chỉ xử lý các trạng thái quan trọng
    if (
      currentStatus !== YT.PlayerState.PLAYING &&
      currentStatus !== YT.PlayerState.PAUSED
    ) {
      return;
    }

    // Kiểm tra chênh lệch với lần đồng bộ cuối
    const timeDiff = Math.abs(currentTime - this.lastSyncedTime);
    const isDuplicate =
      currentStatus === this.lastSyncedStatus &&
      timeDiff < this.syncThreshold;

    if (isDuplicate) {
      console.log('🔄 Trạng thái trùng, bỏ qua gửi');
      return;
    }

    // Gửi trạng thái mới
    const roomId = localStorage.getItem('roomId');
    if (roomId) {
      console.log(`📤 Gửi trạng thái: ${currentStatus} tại ${currentTime}s`);
      this.roomHub.sendPlayerStatus(roomId, currentStatus, currentTime);
      this.lastSyncedStatus = currentStatus;
      this.lastSyncedTime = currentTime;
    }
  }
  private async updatePlayerFromSignalR(
    roomId: string,
    status: number,
    time: number
  ) {
    try {
      this.isExternalUpdate = true;

      console.log(`🔄 Cập nhật từ server: ${status} tại ${time}s`);

      // Thực hiện seek và thay đổi trạng thái
      await new Promise<void>((resolve) => {
        this.player.seekTo(time, true);
        setTimeout(resolve, 100); // Đợi seek hoàn tất
      });

      if (status === YT.PlayerState.PLAYING) {
        this.player.playVideo();
      } else {
        this.player.pauseVideo();
      }

      // Cập nhật thông tin đồng bộ
      this.lastSyncedStatus = status;
      this.lastSyncedTime = time;
    } catch (error) {
      console.error('❌ Lỗi cập nhật player:', error);
    } finally {
      setTimeout(() => {
        this.isExternalUpdate = false;
      }, 1000); // Đảm bảo qua mọi state change phát sinh
    }
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
