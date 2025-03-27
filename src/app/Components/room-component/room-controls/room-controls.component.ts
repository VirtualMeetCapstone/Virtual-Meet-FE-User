import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { RoomHubService } from '../../../Hub/room-hub/room-hub.service';
import { RtcHubService } from '../../../Hub/rtc-hub/rtc-hub.service';

const resolutionLevels = {
  free: [
    { label: "144p", width: 256, height: 144 },
    { label: "240p", width: 426, height: 240 },
    { label: "360p", width: 640, height: 360 },
  ],
  vip: [
    { label: "144p", width: 256, height: 144 },
    { label: "240p", width: 426, height: 240 },
    { label: "360p", width: 640, height: 360 },
    { label: "480p", width: 854, height: 480 },
    { label: "720p", width: 1280, height: 720 },
    { label: "1080p", width: 1920, height: 1080 },
  ],
};

@Component({
  selector: 'app-room-control',
  templateUrl: './room-controls.component.html',
  styleUrls: ['./room-controls.component.scss'],
})
export class RoomControlsComponent {
  @HostBinding('class.activity-option') activityOptionClass = true;
  @Output() resolutionChanged = new EventEmitter<{ width: number; height: number }>();

  resolutions = resolutionLevels.free;
  selectedResolution = this.resolutions[0];

  constructor(
    private roomHubService: RoomHubService,
    private rtcHub: RtcHubService
  ) {
    this.setUserResolutionLevel();
  }

  private setUserResolutionLevel() {
    const userVipLevel = this.getUserVipLevel();
    this.resolutions = resolutionLevels[userVipLevel] || resolutionLevels.free;
    this.selectedResolution = this.resolutions[0];
    console.log(`🎥 Cấp độ VIP: ${userVipLevel}, độ phân giải tối đa:`, this.resolutions);
  }

  private getUserVipLevel(): keyof typeof resolutionLevels {
    return "free"; // Thay bằng API lấy role thực tế
  }

  async onResolutionChange() {
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

      if (!newStream.getVideoTracks().length) {
        throw new Error('❌ Không có video track trong stream mới.');
      }

      console.log("🎥 [onResolutionChange] Đã lấy stream mới");

      const newVideoTrack = newStream.getVideoTracks()[0];
      const peerIds = Object.keys(this.rtcHub.peers); // Lấy danh sách các peerId
      if (peerIds.length === 0) {
        console.error("⚠️ [onResolutionChange] Không tìm thấy PeerID nào!");
        return;
      }

      const peerConnection = this.rtcHub.getPeerConnection(peerIds[0]);
      if (!peerConnection) {
        console.error("⚠️ [onResolutionChange] Không tìm thấy PeerConnection!");
        return;
      }

      console.log("🔗 [onResolutionChange] PeerConnection tìm thấy:", peerConnection);

      const sender = peerConnection.getSenders().find(s => s.track?.kind === "video");

      if (sender) {
        console.log("🔄 [onResolutionChange] Thay thế track cũ bằng track mới...");
        await sender.replaceTrack(newVideoTrack);
      } else {
        console.warn("⚠️ [onResolutionChange] Không tìm thấy sender, thêm track mới vào PeerConnection.");
        peerConnection.addTrack(newVideoTrack, newStream);
      }

      // Cập nhật stream cục bộ
      this.roomHubService.updateLocalStream(newStream);
      this.resolutionChanged.emit({
        width: this.selectedResolution.width,
        height: this.selectedResolution.height,
      });

      // Giới hạn bitrate
      this.setBitrateLimit(newStream, peerIds[0]);

      console.log(`✅ Đã thay đổi độ phân giải: ${this.selectedResolution.label}`);
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật độ phân giải:', error);
    }
  }

  /**
   * Giới hạn bitrate dựa vào cấp độ VIP
   */
  private async setBitrateLimit(stream: MediaStream, peerId: string) {
    console.log("🔥 [setBitrateLimit] Hàm được gọi!");

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn("⚠️ [setBitrateLimit] Không tìm thấy video track!");
      return;
    }
    console.log("🎥 [setBitrateLimit] Video track đã tìm thấy:", videoTrack.label);

    // Lấy PeerConnection với peerId cụ thể
    const peerConnection = this.rtcHub.getPeerConnection(peerId);
    if (!peerConnection) {
      console.warn(`⚠️ [setBitrateLimit] Không tìm thấy PeerConnection với peerId: ${peerId}`);
      return;
    }

    const sender = peerConnection.getSenders().find(s => s.track?.kind === "video");
    if (!sender) {
      console.warn("⚠️ [setBitrateLimit] Không tìm thấy RTCRtpSender!");
      return;
    }
    console.log("📡 [setBitrateLimit] RTCRtpSender tìm thấy:", sender);

    const bitrate = this.getBitrateLimit();
    console.log(`💰 [setBitrateLimit] Bitrate cần đặt: ${bitrate / 1000} kbps`);

    const params = sender.getParameters();
    console.log("⚙️ [setBitrateLimit] Tham số ban đầu của sender:", params);

    if (!params.encodings) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = bitrate;

    await sender.setParameters(params);
    console.log(`🚀 [setBitrateLimit] Đã đặt bitrate thành công: ${bitrate / 1000} kbps`);
  }

  /**
   * Trả về bitrate tương ứng với cấp độ VIP
   */
  private getBitrateLimit(): number {
    const userVipLevel = this.getUserVipLevel();

    const bitrateLevels = {
      free: 150_000, // 150 kbps
      vip: 2_000_000, // 2 Mbps
    };

    return bitrateLevels[userVipLevel] || bitrateLevels.free;
  }
}
