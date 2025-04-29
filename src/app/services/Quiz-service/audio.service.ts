import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private backgroundAudio = new Audio('assets/nhac/nhacnen.mp3'); // Nhạc nền

  playBackgroundMusic() {
    this.backgroundAudio.loop = true; // Lặp lại nhạc nền
    this.backgroundAudio.volume = 0.5; // Đặt âm lượng
    console.log('Playing background music...');
    this.backgroundAudio.play().catch((error) => {
      console.error('Error playing background music:', error);
    });
  }

  stopBackgroundMusic() {
    console.log('Stopping background music...');
    this.backgroundAudio.pause(); // Tạm dừng nhạc nền
    this.backgroundAudio.currentTime = 0; // Đặt lại thời gian phát về 0
  }

  playCorrect() {
    this.stopBackgroundMusic(); // Tắt nhạc nền
    const correctAudio = new Audio('assets/nhac/correct-6033.mp3'); // Nhạc đúng
    correctAudio.play().catch((error) => {
      console.error('Error playing correct sound:', error);
    });

    // Tiếp tục phát nhạc nền sau khi nhạc đúng kết thúc
    correctAudio.onended = () => {
      this.playBackgroundMusic();
    };
  }

  playWrong() {
    this.stopBackgroundMusic(); // Tắt nhạc nền
    const wrongAudio = new Audio(
      'assets/nhac/buzzer-or-wrong-answer-20582.mp3'
    ); // Nhạc sai
    wrongAudio.play().catch((error) => {
      console.error('Error playing wrong sound:', error);
    });

    // Tiếp tục phát nhạc nền sau khi nhạc sai kết thúc
    wrongAudio.onended = () => {
      this.playBackgroundMusic();
    };
  }
}
