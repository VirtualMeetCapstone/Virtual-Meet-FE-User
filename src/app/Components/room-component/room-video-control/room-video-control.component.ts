import { Component, HostBinding, Output, EventEmitter, OnInit } from '@angular/core';
import { RoomHubService } from '../../../Hub/room-hub/room-hub.service';
import { RtcHubService } from '../../../Hub/rtc-hub/rtc-hub.service';

const resolutionLevels = [
  { label: "144p", width: 256, height: 144, isVip: false },
  { label: "240p", width: 426, height: 240, isVip: false },
  { label: "360p", width: 640, height: 360, isVip: false },
  { label: "480p", width: 854, height: 480, isVip: true },
  { label: "720p", width: 1280, height: 720, isVip: true },
  { label: "1080p", width: 1920, height: 1080, isVip: true },
];

@Component({
  selector: 'app-room-video-control',
  templateUrl: './room-video-control.component.html',
  styleUrls: ['./room-video-control.component.scss'],
})
export class RoomVideoControlComponent implements OnInit {
  @HostBinding('class.activity-option') activityOptionClass = true;
  @Output() resolutionChanged = new EventEmitter<{ width: number; height: number }>();

  resolutions = resolutionLevels;
  selectedResolution = this.resolutions[0];
  isVipUser = false;

  constructor(
    private roomHubService: RoomHubService,
    private rtcHub: RtcHubService
  ) {}

  ngOnInit() {
    this.isVipUser = this.getUserVipLevel() === 'vip';
    this.restoreLastSelectedResolution();
  }

  private restoreLastSelectedResolution() {
    const saved = localStorage.getItem('selectedResolution');
    if (saved) {
      const parsed = JSON.parse(saved);
      const matched = this.resolutions.find(
        r => r.width === parsed.width && r.height === parsed.height
      );
      if (matched && (!matched.isVip || this.isVipUser)) {
        this.selectedResolution = matched;
      }
    }
  }

  private getUserVipLevel(): 'free' | 'vip' {
    return 'free';
  }

  async onResolutionChange() {
    if (this.selectedResolution.isVip && !this.isVipUser) {
      console.warn('Không thể chọn độ phân giải VIP nếu không phải VIP!');
      return;
    }

    localStorage.setItem('selectedResolution', JSON.stringify(this.selectedResolution));
    console.log(`🔄 Đang thay đổi độ phân giải: ${this.selectedResolution.label}`);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.selectedResolution.width },
          height: { ideal: this.selectedResolution.height },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const peerIds = Object.keys(this.rtcHub.peers);
      if (peerIds.length === 0) return;

      const peerConnection = this.rtcHub.getPeerConnection(peerIds[0]);
      const sender = peerConnection?.getSenders().find(s => s.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      } else {
        peerConnection?.addTrack(newVideoTrack, newStream);
      }

      this.roomHubService.updateLocalStream(newStream);
      this.resolutionChanged.emit({
        width: this.selectedResolution.width,
        height: this.selectedResolution.height,
      });

      this.setBitrateLimit(newStream, peerIds[0]);
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật độ phân giải:', error);
    }
  }

  private async setBitrateLimit(stream: MediaStream, peerId: string) {
    const sender = this.rtcHub.getPeerConnection(peerId)
      ?.getSenders()
      .find(s => s.track?.kind === "video");
    if (!sender) return;

    const bitrate = this.getBitrateLimit();
    const params = sender.getParameters();
    if (!params.encodings) params.encodings = [{}];
    params.encodings[0].maxBitrate = bitrate;
    await sender.setParameters(params);
  }

  private getBitrateLimit(): number {
    return this.isVipUser ? 2_000_000 : 150_000;
  }
}
