import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';

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

  private token = 'sk-tQMbZpvTcBrkSrGYMyEPSWJU2YprRrT8qg6xt24zRGihPPcl';
  private endpoint = 'https://api.chatanywhere.org';
  private modelName = 'gpt-4o-mini';

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  toggleMinimize(event: Event) {
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

      const client = ModelClient(
        this.endpoint,
        new AzureKeyCredential(this.token)
      );

      try {
        const systemPrompt =
          'Bạn là một trợ lý AI cho trang web của chúng tôi. Trang web này chuyên về một hệ thống phòng họp ảo có tên là VirtualMeet. VirtualMeet là nền tảng giao tiếp toàn cầu kết nối người học ngôn ngữ, giáo viên và chuyên gia qua giọng nói, văn bản và công cụ tương tác, phá vỡ rào cản ngôn ngữ và địa lý để thúc đẩy trao đổi văn hóa và học tập hợp tác. Với bảo mật cấp doanh nghiệp (JWT, OAuth2.0, HMAC) và thiết kế thân thiện, nó phục vụ người học ngôn ngữ, tổ chức giáo dục, doanh nghiệp, cộng đồng toàn cầu và nhà sáng tạo nội dung. Giá trị cốt lõi: Giao tiếp đa dạng, tập trung học ngôn ngữ (phiên dịch trực tiếp, tra từ, ghép cặp), bảo mật mạnh mẽ, kiến trúc 3 lớp (Trình bày, Logic Kinh doanh, Truy cập Dữ liệu), tính năng xã hội (bài đăng, câu chuyện, theo dõi). Lợi thế cạnh tranh: Công nghệ tích hợp (WebRTC, SignalR, MongoDB, SQL Server), quản lý phòng nâng cao, công cụ học tập tương tác, thiết kế đám mây Azure, đa nền tảng. Tầm nhìn: Cách mạng hóa học ngôn ngữ, đặt chuẩn quản lý phòng ảo, xây dựng cộng đồng toàn cầu an toàn, phát triển cùng công nghệ mới. Hãy trả lời các câu hỏi của người dùng một cách chính xác và hữu ích trong tầm 20-40 từ.';

        const response = await client.path('/chat/completions').post({
          body: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: newMessage.text },
            ],
            temperature: 1,
            top_p: 1,
            model: this.modelName,
          },
        });

        if ('choices' in response.body) {
          const content = response.body.choices[0].message.content;
          const aiText = content !== null ? content : 'No response from AI';
          const aiMessage = {
            text: aiText,
            isUser: false,
            timestamp: new Date(),
          };
          this.messages.push(aiMessage);
        } else if ('error' in response.body) {
          throw new Error(response.body.error.message);
        } else {
          throw new Error('Phản hồi không hợp lệ từ API.');
        }
      } catch (error) {
        const errorMessage = {
          text: 'Xin lỗi, đã xảy ra lỗi khi kết nối với AI.',
          isUser: false,
          timestamp: new Date(),
        };
        this.messages.push(errorMessage);
        console.error('API Error:', error);
      }
    }
  }
}
