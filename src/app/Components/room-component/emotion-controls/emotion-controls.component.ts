import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RoomHubService } from '../../../Hub/room-hub/room-hub.service'; // Điều chỉnh đường dẫn theo cấu trúc của bạn
import { AuthService } from '../../../services/auth-service/auth.service';
@Component({
  selector: 'app-emotion-controls',
  templateUrl: './emotion-controls.component.html',
  styleUrls: ['./emotion-controls.component.scss']
})
export class EmotionControlsComponent {
  @Input() userName: string = 'You';
  @Output() raiseHand = new EventEmitter<void>();
  @Output() emotionSent = new EventEmitter<{ type: string; userName: string; x: number; y: number }>();
  userId: string = '';
  name : string = '';
  user : any;
  constructor(private roomHubService: RoomHubService,
        private authService: AuthService,

  ) {
    this.userId = authService.getUser()?.id;

    // Lắng nghe sự kiện từ SignalR (nếu cần hiển thị emotion từ người khác trong component này)
    this.roomHubService.receiveEmotion((username, type, x, y) => {
      console.log(`Received emotion from ${username}: ${type} at (${x}, ${y})`);

      if (username !== this.userId ) {
        this.user = authService.getBackendUser(username);
        this.name = this.user.__zone_symbol__value.name;;
        this.emotionSent.emit({ type, userName:  this.name, x, y });
      }
    });

    this.roomHubService.receiveRaiseHand((username) => {
      console.log(`${username} raised hand`);
      this.raiseHand.emit(); // Gửi lên component cha nếu cần
    });
  }

  sendRaiseHand() {
    console.log(`${this.userName} raised hand`);
    this.roomHubService.sendRaiseHand(); // Gửi qua SignalR
    this.raiseHand.emit();
  }

  sendEmotion(type: string) {
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 300);
    const event = { type, userName:this.userId , x, y };
    console.log('Emotion sent:', event);
    this.roomHubService.sendEmotion(type, x, y); // Gửi qua SignalR
    this.emotionSent.emit(event);
  }
}
