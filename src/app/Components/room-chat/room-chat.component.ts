import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../../services/auth-service/auth.service';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { ChatServicesService } from '../../services/chat-services/chat-services.service';
import { SpeechService } from '../../services/external-service/speech.service';
import { TranslateService } from '../../services/external-service/translate.service';

@Component({
  selector: 'app-room-chat',
  templateUrl: './room-chat.component.html',
  styleUrls: ['./room-chat.component.scss'],
})
export class RoomChatComponent implements OnInit {
  //start init
  messages: any[] = [];
  newMessage: string = '';
  currentUser: string = '';
  private hubConnection!: signalR.HubConnection;
  private roomId = '';
  isListening: boolean = false;
  translatedText: string = '';
  userCache = new Map<string, string>();
  selectedLanguage: string = 'vi-VN';
  //end init

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private roomHubService: RoomHubService,
    private chatService: ChatServicesService,
    private speechService: SpeechService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  private isEventRegistered = false; // ✅ Tránh lặp sự kiện

  async ngOnInit(): Promise<void> {
    this.currentUser = this.authService.getUserFromToken()?.id || localStorage.getItem('senderId') || '';

    this.route.paramMap.subscribe((params) => {
      this.roomId = params.get('roomId') || '';
    });

    this.roomHubService.messages$.subscribe((msgs) => {
      this.messages = msgs;
      this.loadUserNames(); // optional
      this.cdr.detectChanges();
    });
  }

  sendMessage(event?: KeyboardEvent | any): void {
    if (event instanceof KeyboardEvent) event.preventDefault();

    const messageText = Array.isArray(this.newMessage) ? this.newMessage.join(' ') : this.newMessage;
    if (!messageText?.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const messageData = {
      id: tempId,
      senderId: this.currentUser,
      content: messageText,
      isPinned: false,
    };

    this.newMessage = '';

    this.roomHubService.hubConnection
      .invoke('SendMessage', this.roomId, messageData)
      .catch((err) => console.error('❌ Send error:', err));
  }

  loadUserName(userId: string): void {
    if (this.userCache.has(userId)) return; // Nếu đã có trong cache thì bỏ qua

    this.authService.getUserByID(userId).subscribe((name: string) => {
      console.log('user name la', name);
      console.log('user id la', userId);
      this.userCache.set(userId, name); // Lưu vào cache
      this.cdr.detectChanges();
    });
  }

  // ✅ Hàm lấy tên cho tất cả tin nhắn cũ
  loadUserNames(): void {
    this.messages.forEach((msg) => this.loadUserName(msg.senderId));
  }

  // ✅ Hàm hiển thị tên user từ cache
  getUserName(senderId: string): string {
    console.log('senderId: ', senderId);
    console.log('user cache', this.userCache);
    return this.userCache.get(senderId) || 'Đang tải...';
  }

  //start voice chat
  startVoiceRecognition() {
    this.isListening = true;
    this.speechService.startListening(async (recognizedText: string) => {
      this.newMessage = recognizedText;

      // Chỉ giữ lại mã ngôn ngữ ngắn (vi, en)
      const sourceLang = this.selectedLanguage.includes('-')
        ? this.selectedLanguage.split('-')[0]
        : this.selectedLanguage;

      const targetLang = sourceLang === 'vi' ? 'en' : 'vi';

      this.translatedText = await this.translateService.translate(
        this.newMessage,
        sourceLang,
        targetLang
      );

      this.newMessage = this.translatedText;
      this.isListening = false;
      this.cdr.detectChanges();
    }, this.selectedLanguage);
}

  stopVoiceRecognition() {
    this.isListening = false;
    this.speechService.stopListening();
  }
  //end voice chat
}
