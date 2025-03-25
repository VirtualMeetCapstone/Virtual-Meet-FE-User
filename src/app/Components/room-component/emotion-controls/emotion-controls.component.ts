import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { RoomHubService } from '../../../Hub/room-hub/room-hub.service'; // Điều chỉnh đường dẫn theo cấu trúc của bạn
import { AuthService } from '../../../services/auth-service/auth.service';

@Component({
  selector: 'app-emotion-controls',
  templateUrl: './emotion-controls.component.html',
  styleUrls: ['./emotion-controls.component.scss'],
})
export class EmotionControlsComponent {
  @Input() userName: string = 'You';
  @Output() raiseHand = new EventEmitter<{ userName: string }>();
  @Output() lowerHand = new EventEmitter<{ userName: string }>();
  @Output() emotionSent = new EventEmitter<{
    type: string;
    userName: string;
    x: number;
    y: number;
  }>();

  userId: string = '';
  name: string = '';
  user: any;
  isHandRaised = false;

  constructor(
    private roomHubService: RoomHubService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = authService.getUser()?.id;

    // Lắng nghe sự kiện emotion
    this.roomHubService.receiveEmotion(async (username, type, x, y) => {
      console.log(`Received emotion from ${username}: ${type} at (${x}, ${y})`);

      if (!username || username === this.userId) return;

      const name = await this.fetchUserName(username);
      if (!name) return;

      console.log('🔹 Emitting emotion event:', { type, userName: name, x, y });
      this.emotionSent.emit({ type, userName: name, x, y });

      this.cdr.detectChanges(); // Cập nhật UI
    });

    // Lắng nghe sự kiện raise hand
    this.roomHubService.receiveRaiseHand(async (username) => {
      console.log(`${username} raised hand`);

      if (!username) {
        console.error('❌ Received undefined username in receiveRaiseHand!');
        return;
      }

      const name = await this.fetchUserName(username);
      if (!name) return;

      console.log('🔹 Emitting raiseHand event from SignalR:', name);
      this.raiseHand.emit({ userName: name });

      // Nếu user hiện tại là người giơ tay, cập nhật trạng thái
      if (username === this.userId) {
        this.isHandRaised = true;
      }

      this.cdr.detectChanges(); // Cập nhật UI
    });

    // Lắng nghe sự kiện lower hand
    this.roomHubService.receiveLowerHand(async (username) => {
      console.log(`${username} lowered hand`);

      if (!username) {
        console.error('❌ Received undefined username in receiveLowerHand!');
        return;
      }

      const name = await this.fetchUserName(username);
      if (!name) return;

      console.log('🔹 Emitting lowerHand event from SignalR:', name);
      this.lowerHand.emit({ userName: name });

      // Nếu user hiện tại là người hạ tay, cập nhật trạng thái
      if (username === this.userId) {
        this.isHandRaised = false;
      }

      this.cdr.detectChanges(); // Cập nhật UI
    });
  }

  /**
   * Lấy tên user từ backend một cách an toàn
   */
  private async fetchUserName(username: string): Promise<string | null> {
    try {
      const user = await this.authService.getBackendUser(username);
      console.log('🔹 User data received:', user);

      if (!user || !user.name) {
        console.error(`❌ User data not found for ${username}`);
        return null;
      }

      return user.name;
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  }

  sendRaiseHand() {
    if (!this.userId) {
      console.error('❌ User ID is undefined!');
      return;
    }

    console.log(`${this.userId} raised hand`);
    this.roomHubService.sendRaiseHand();
    this.raiseHand.emit({ userName: this.userId });

    this.isHandRaised = true;
    this.cdr.detectChanges();
  }

  sendLowerHand() {
    if (!this.userId) {
      console.error('❌ User ID is undefined!');
      return;
    }

    console.log(`${this.userId} lowered hand`);
    this.roomHubService.sendLowerHand();
    this.lowerHand.emit({ userName: this.userId });

    this.isHandRaised = false;
    this.cdr.detectChanges();
  }

  toggleRaiseHand() {
    console.log("🔄 Toggle Raise Hand, current state:", this.isHandRaised);

    if (this.isHandRaised) {
      this.sendLowerHand();
    } else {
      this.sendRaiseHand();
    }
  }


  sendEmotion(type: string) {
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 300);
    const event = { type, userName: this.userId, x, y };
    console.log('Emotion sent:', event);
    this.roomHubService.sendEmotion(type, x, y);
    this.emotionSent.emit(event);

    // Bắt buộc UI cập nhật
    this.cdr.detectChanges();
  }
}
