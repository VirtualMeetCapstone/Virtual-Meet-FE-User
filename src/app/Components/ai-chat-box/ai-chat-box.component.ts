import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../constant/AppConstants';

@Component({
  selector: 'app-ai-chat-box',
  templateUrl: './ai-chat-box.component.html',
  styleUrls: ['./ai-chat-box.component.scss'],
})
export class AiChatBoxComponent implements OnInit {
  messages: { text: string; isUser: boolean; timestamp: Date }[] = [];
  userInput: string = '';
  isMinimized: boolean = true;
  isMenuOpen: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  toggleMinimize(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isMinimized = !this.isMinimized;
    if (!this.isMinimized && this.messages.length === 0) {
      this.messages.push({
        text: 'Hello. How can I assist you today?',
        isUser: false,
        timestamp: new Date(),
      });
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  endChat(event: Event) {
    event.stopPropagation();
    this.messages = [];
    this.isMinimized = true;
  }

  async sendMessage() {
    if (this.userInput.trim()) {
      const newMessage = {
        text: this.userInput,
        isUser: true,
        timestamp: new Date(),
      };
      this.messages.push(newMessage);
      this.userInput = '';

      // Thêm tin nhắn tạm thời "Đang trả lời bạn..."
      const typingMessage = {
        text: 'Đang trả lời bạn...',
        isUser: false,
        timestamp: new Date(),
      };
      this.messages.push(typingMessage);

      const apiUrl = `${AppConstants.API_BASE_URL_HTTPS}/moderation/send-message`;
      const payload = { text: newMessage.text };

      try {
        const response: any = await this.http.post(apiUrl, payload).toPromise();
        console.log('Phản hồi từ API:', response);

        // Cập nhật tin nhắn tạm thời với phản hồi từ API
        typingMessage.text = response?.text || 'No response from server';
        typingMessage.timestamp = new Date();
      } catch (error) {
        // Cập nhật tin nhắn tạm thời với thông báo lỗi
        typingMessage.text = 'Xin lỗi, đã xảy ra lỗi khi gửi tin nhắn.';
        typingMessage.timestamp = new Date();
        console.error('Lỗi khi gửi tin nhắn:', error);
      }
    }
  }
}
