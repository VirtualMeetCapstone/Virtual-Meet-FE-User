import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private recognition: any;
  private language: string = 'vi-VN'; // Mặc định tiếng Việt

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Trình duyệt không hỗ trợ Web Speech API');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
  }

  // ✅ Thêm tham số language để chọn ngôn ngữ đầu vào
  startListening(callback: (text: string) => void, language: string = 'vi-VN') {
    this.language = language;
    this.recognition.lang = this.language; // Cập nhật ngôn ngữ

    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      callback(text);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Lỗi nhận diện giọng nói:', event.error);
      this.stopListening();
    };
  }

  stopListening() {
    this.recognition.stop();
  }
}
