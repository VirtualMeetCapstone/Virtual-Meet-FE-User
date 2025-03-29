import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private recognition: any;
  private isListening: boolean = false;
  private language: string = 'vi-VN';

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Trình duyệt không hỗ trợ Web Speech API');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
  }

  startListening(callback: (text: string) => void, language: string = 'vi-VN') {
    if (this.isListening) return;

    this.isListening = true;
    this.language = language;
    this.recognition.lang = this.language;

    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript;
      callback(text);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Lỗi nhận diện giọng nói:', event.error);
      this.stopListening();
    };
  }

  stopListening() {
    this.isListening = false;
    this.recognition.stop();
  }
}
