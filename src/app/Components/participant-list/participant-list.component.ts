import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { RtcHubService } from '../../Hub/rtc-hub/rtc-hub.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-participant-list',
  templateUrl: './participant-list.component.html',
  styleUrls: ['./participant-list.component.scss'],
})
export class ParticipantListComponent implements OnInit {
  @Input() isParticipantsOpen = false;
  isHost = false;
  participants: any[] = []; // Danh sách các peer tham gia
  userId: string = '';
  roomOwnerId: string = '';
  userCache = new Map<string, any>();
  selectedUser: any; // Người dùng được chọn để kick
  isKickPopupVisible = false; // Hiển thị popup
  selectedReason: string = ''; // Lý do được chọn
  reasons = [
    'Vi phạm nội quy',
    'Gây rối trong phòng',
    'Ngôn ngữ không phù hợp',
    'Khác',
  ];

  constructor(
    private rtcHubService: RtcHubService,
    private authService: AuthService,
    private roomHub: RoomHubService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog // Thêm MatDialog để mở hộp thoại
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUser()?.id;


    if (!this.userId) {
      console.error(
        '❌ Không thể lấy User ID. Dừng thực hiện các hàm tiếp theo.'
      );
      return;
    }

    const roomId = this.rtcHubService.roomHubService.currentUser.roomId; // Hoặc nơi bạn đang lưu roomId
    if (!roomId) {
      console.error('❌ Không có roomId để gọi API.');
      return;
    }

    this.roomHub.getRoomInfo(roomId).subscribe({
      next: (room) => {
        this.roomOwnerId = room.ownerId;
        this.isHost = this.userId === this.roomOwnerId;

        console.log('👑 Room Owner:', this.roomOwnerId);
        console.log('🧍 Bạn có phải host?', this.isHost);

        this.setupRoomEvents(); // Đặt phần logic nhận mic/video sau khi có owner
      },
      error: (err) => {
        console.error('❌ Không lấy được thông tin phòng:', err);
      },
    });
  }

  setupRoomEvents() {
    this.roomHub.receiveMicStatusUpdate((userId: string, isMicOn: boolean) => {
      const user = this.participants.find((p) => p.id === userId);
      if (user) {
        user.muted = !isMicOn; // Nếu mic tắt (isMicOn = false), trạng thái muted = true
        this.cd.detectChanges();
      }
    });

    this.roomHub.receiveVideoStatusUpdate(
      (userId: string, isCameraOn: boolean) => {
        const user = this.participants.find((p) => p.id === userId);
        if (user) {
          user.cameraOff = !isCameraOn;
          this.cd.detectChanges();
        }
      }
    );

    this.rtcHubService.peers$.subscribe(async (peers) => {
      const currentUser = this.rtcHubService.roomHubService.currentUser;
      const thisConnectionId = this.rtcHubService.getConnectionId();

      if (!thisConnectionId) {
        console.error('❌ Không thể lấy Connection ID.');
        return;
      }

      const isSelfIncluded = peers.some(
        (peer) =>
          peer.peerId === thisConnectionId || peer.userName === currentUser.name
      );

      const fullPeers = [
        ...peers,
        ...(!isSelfIncluded
          ? [
              {
                peerId: thisConnectionId,
                userName: currentUser.name,
                userId: this.userId,
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
            muted: true,
            cameraOff: true,
            isSelf: isCurrentUser,
            userId: peer.userName,
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
    this.userCache.set(userId, user);
    return user;
  }
  toggleMute(user: any) {
    if (!user.isSelf) {
      user.muted = !user.muted;
      this.roomHub.sendMute(user.userId, user.muted); // Gửi trạng thái mới đến server
    } else {
      console.warn('⚠️ Không thể tắt/bật mic chính mình.');
    }
  }

  toggleVideo(user: any) {
    if (!user.isSelf) {
      user.cameraOff = !user.cameraOff;
      this.roomHub.sendVideoMute(user.userId, user.cameraOff);
    } else {
      console.warn('⚠️ Không thể tắt/bật mic chính mình.');
    }
  }
  removeUser(user: any) {
    this.participants = this.participants.filter((p) => p.id !== user.id);
  }

  // Mở hộp thoại chọn lý do kick
  openKickDialog(user: any): void {
    console.log('👤 Người dùng được chọn để kick:', user);
    this.selectedUser = user; // Lưu thông tin người dùng được chọn
    this.isKickPopupVisible = true; // Hiển thị popup
  }

  // Gửi yêu cầu kick user
  kickUser(user: any, reason: string): void {
    this.roomHub
      .kickUser(user.userId, reason) // Gửi yêu cầu kick đến server
      .then(() => {
        console.log(`✅ User ${user.name} đã bị kick với lý do: ${reason}`);
        this.removeUser(user); // Xóa user khỏi danh sách
      })
      .catch((err) => {
        console.error('❌ Lỗi khi kick user:', err);
      });
  }

  closeKickPopup(): void {
    this.isKickPopupVisible = false; // Ẩn popup
    this.selectedReason = ''; // Reset lý do
  }

  confirmKick(): void {
    if (this.selectedUser && this.selectedReason) {
      this.kickUser(this.selectedUser, this.selectedReason); // Gửi yêu cầu kick
      this.closeKickPopup();
    }
  }
}
