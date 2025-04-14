import { Component, Input, OnInit } from '@angular/core';
import { RtcHubService } from '../../Hub/rtc-hub/rtc-hub.service';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
  selector: 'app-participant-list',
  templateUrl: './participant-list.component.html',
  styleUrls: ['./participant-list.component.scss'],
})
export class ParticipantListComponent implements OnInit {
  @Input() isParticipantsOpen = false;
  @Input() isHost = false;
  participants: any[] = []; // Danh sách các peer tham gia
  userId: string = '';
  userCache = new Map<string, any>();

  constructor(
    private rtcHubService: RtcHubService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUser()?.id;

    this.rtcHubService.peers$.subscribe(async (peers) => {
      const currentUser = this.rtcHubService.roomHubService.currentUser;
      const thisConnectionId = this.rtcHubService.getConnectionId();

      const isSelfIncluded = peers.some(
        (peer) =>
          peer.peerId === thisConnectionId ||
          peer.userName === currentUser.name
      );

      const fullPeers = [
        ...peers,
        ...(!isSelfIncluded
          ? [
              {
                peerId: thisConnectionId,
                userName: currentUser.name,
                userId: this.userId
              },
            ]
          : []),
      ];

      this.participants = await Promise.all(
        fullPeers.map(async (peer) => {
          const isCurrentUser =
            peer.peerId === thisConnectionId || peer.userName === this.userId;

          let userInfo = await this.loadUserInfo(peer.userName);

          return {
            id: peer.peerId,
            name: isCurrentUser ? '' : userInfo?.name || peer.userName,
            avatarUrl: userInfo?.picture?.url,
            muted: false,
            cameraOff: false,
            isSelf: isCurrentUser,
          };
        })
      );

      console.log('📋 Participants with name + avatar:', this.participants);
    });
  }


  toggleParticipants() {
    this.isParticipantsOpen = !this.isParticipantsOpen;
  }


  async loadUserInfo(userId: string): Promise<any> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }

    const user = await this.authService.getBackendUser(userId);
    console.log('🔹 Backend user data:', user);
    this.userCache.set(userId, user);
    return user;
  }
  toggleMute(user: any) {
    user.muted = !user.muted;
  }

  removeUser(user: any) {
    this.participants = this.participants.filter((p) => p.id !== user.id);
  }
}
