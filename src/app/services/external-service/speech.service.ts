import { Injectable } from '@angular/core';
import { franc } from 'franc-min';
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
        setTimeout(() => this.recognition.start(), 500);
      }
    };

    this.recognition.onerror = (event: any) => {

      setTimeout(() => {
        if (this.isListening) {
          this.startListening(callback, language);
        }
      }, 1000);
    };
  }


  stopListening() {
    this.isListening = false;
    this.recognition.stop();
  }


public detectLanguageWithConfidence(text: string): string {
  const fastResult = this.detectLangFast(text);
  if (fastResult !== 'unknown') return fastResult;

  const lang = franc(text, {
      minLength: 3,
      only: ['vie', 'eng'] // Only consider Vietnamese and English
  });

  return lang === 'vie' ? 'vi' : 'en';
}

// More flexible Vietnamese detection
public detectLangFast(text: string): string {
  if (!text) return 'unknown';

  const cleanText = text.replace(/[.,!?]/g, '').toLowerCase();
  const vietnameseChars = cleanText.match(/[ăâêôơưđáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/gi);

  // Lower threshold to 20% and check minimum 2 Vietnamese characters
  if (vietnameseChars &&
      (vietnameseChars.length >= 2 ||
       vietnameseChars.length / cleanText.length > 0.2)) {
      return 'vi';
  }

  // Check for obvious English patterns
  const englishWords = cleanText.match(/\b(the|and|you|that|for)\b/gi);
  if (englishWords && englishWords.length > 0) {
      return 'en';
  }

  return 'unknown';
}

// Better language code mapping
public mapToWebSpeechLanguage(lang: string): string {
  switch (lang) {
      case 'vi': return 'vi-VN';
      case 'en': return 'en-US';
      // Add more languages as needed
      default: return 'en-US'; // Still default to English
  }
}

}
