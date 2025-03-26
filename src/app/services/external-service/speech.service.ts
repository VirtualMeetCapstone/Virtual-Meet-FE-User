import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private recognition: any; // Khai báo biến nhận diện giọng nói

  constructor() {
    // Kiểm tra nếu trình duyệt hỗ trợ Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Trình duyệt không hỗ trợ Web Speech API');
    }

    // Khởi tạo nhận diện giọng nói
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'vi-VN'; // Cấu hình ngôn ngữ tiếng Việt
    this.recognition.interimResults = false; // Chỉ nhận kết quả cuối cùng
    this.recognition.continuous = false; // Dừng khi người dùng ngừng nói
  }

  // Bắt đầu lắng nghe
  startListening(callback: (text: string) => void) {
    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      callback(text); // Trả kết quả về component
    };

    this.recognition.onerror = (event: any) => {
      console.error('Lỗi nhận diện giọng nói:', event.error);
      this.stopListening() ;
    };
  }

  // Dừng lắng nghe
  stopListening() {
    this.recognition.stop();
  }
}
