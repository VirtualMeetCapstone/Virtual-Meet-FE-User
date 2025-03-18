import { Injectable } from '@angular/core';
import { RoomHubService } from '../room-hub/room-hub.service';

@Injectable({
  providedIn: 'root'
})
export class RtcHubService {
    constructor(private roomHubService: RoomHubService) {}

    public async sendOffer(roomId: string, offer: RTCSessionDescriptionInit): Promise<void> {
      await this.roomHubService.sendRTCSignal('SendOffer', roomId, offer);
    }

    public async sendAnswer(roomId: string, answer: RTCSessionDescriptionInit): Promise<void> {
      await this.roomHubService.sendRTCSignal('SendAnswer', roomId, answer);
    }

    public async sendCandidate(roomId: string, candidate: RTCIceCandidateInit): Promise<void> {
      await this.roomHubService.sendRTCSignal('SendCandidate', roomId, candidate);
    }

    public onReceiveOffer(callback: (offer: RTCSessionDescriptionInit) => void): void {
      this.roomHubService.onRTCSignal('ReceiveOffer', callback);
    }

    public onReceiveAnswer(callback: (answer: RTCSessionDescriptionInit) => void): void {
      this.roomHubService.onRTCSignal('ReceiveAnswer', callback);
    }

    public onReceiveCandidate(callback: (candidate: RTCIceCandidateInit) => void): void {
      this.roomHubService.onRTCSignal('ReceiveCandidate', callback);
    }

    sendHangUp(roomId: string, userId: string) {
      this.roomHubService.sendRTCSignal('SendHangUp', roomId, userId)
        .catch(err => console.error('❌ Lỗi gửi sự kiện Hang Up:', err));
    }

    onReceiveHangUp(callback: (userId: string) => void) {
      this.roomHubService.onRTCSignal('ReceiveHangUp', callback);
    }
  }

