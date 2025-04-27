import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  Input,
  EventEmitter,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { AudioService } from '../../../services/Quiz-service/audio.service';
import { QuizService } from '../../../services/Quiz-service/quiz.service';

@Component({
  selector: 'app-play-quiz',
  templateUrl: './play-quiz.component.html',
  styleUrl: './play-quiz.component.scss',
})
export class PlayQuizComponent {
  private timerId: any;
  @Input() roomId: string = '';
  @Output() finish = new EventEmitter<void>();
  @Input() user: any = '';
  @Input() QuizSessionId: any;
  intervalId: any;
  showAnswer: any;
  currentQuestionIndex = 0;
  timeLeft = 10;
  timerSubscription: Subscription | null = null;
  selectedAnswer: number | null = null;
  showCorrectAnswer = false;
  score = 0;
  isCorrect: boolean | null = null;
  isNotCorrect: boolean | null = null;
  players: any = [];
  quizFinished = false;
  currentQuestion: any = null;
  @Input() questions: any[] = [];

  // Add to QuizComponent
  constructor(
    private route: ActivatedRoute,
    private signalrService: QuizService,
    private audioService: AudioService
  ) {}

  ngOnInit() {
    console.log('Room ID:', this.questions);
    console.log('QuizSessionId from play:', this.QuizSessionId);
    this.currentQuestion = this.questions[this.currentQuestionIndex];

    // Thêm sự kiện tương tác nếu phát nhạc bị chặn
    document.addEventListener(
      'click',
      () => {
        console.log('User interacted, playing background music...');
        this.audioService.playBackgroundMusic();
      },
      { once: true } // Chỉ chạy một lần
    );

    this.signalrService
      .getListPlayer(this.QuizSessionId)
      .subscribe((players) => {
        this.players = players;
      });
    this.signalrService.answer$.subscribe(() => {
      this.signalrService
        .getListPlayer(this.QuizSessionId)
        .subscribe((players) => {
          this.players = players;
        });
    });
    this.startTimer();
  }
  selectAnswer(index: number) {
    if (this.showCorrectAnswer) return;
    console.log('Selected answer:', index);

    const currentQuestion = this.questions[this.currentQuestionIndex];
    this.currentQuestion.answer =
      this.currentQuestion.options[this.currentQuestion.correctAnswer - 1];
    this.currentQuestion.choosed = this.currentQuestion.options[index - 1];
    const timeBonus = Math.floor((this.timeLeft / 10) * currentQuestion.points);

    if (index === currentQuestion.correctAnswer) {
      this.audioService.playCorrect();
      this.isCorrect = true;

      const data = {
        quizSessionId: this.QuizSessionId,
        playerId: this.user.id,
        scoreToAdd: timeBonus + this.currentQuestion.points,
      };
      this.score += timeBonus + this.currentQuestion.points;
      this.signalrService.addScore(data, this.roomId).subscribe(
        (response: any) => {
          this.signalrService
            .getListPlayer(this.QuizSessionId)
            .subscribe((players) => {
              this.players = players;
              console.log('Players:', players);
            });
        },
        (error: any) => {
          console.error('Error updating score:', error);
        }
      );
    } else {
      this.audioService.playWrong();
      this.isNotCorrect = true;
    }

    this.showAnswer = true;

    setTimeout(() => {
      this.showAnswer = false;
      this.selectedAnswer = null;
      this.showCorrectAnswer = false;
      this.isCorrect = null;
      this.isNotCorrect = null;

      // Chuyển sang câu hỏi tiếp theo
      this.nextQuestion();
    }, this.timeLeft * 1000 - 999);
  }

  nextQuestion() {
    this.currentQuestionIndex++;

    // Kiểm tra nếu đã hết câu hỏi
    if (this.currentQuestionIndex >= this.questions.length) {
      this.signalrService.getListPlayer(this.roomId).subscribe((res: any) => {
        this.players = res;
        console.log('Players:', res);
      });
      this.startCountdown();
      this.quizFinished = true;
      this.audioService.stopBackgroundMusic(); // Dừng nhạc nền khi kết thúc quiz
      return;
    }

    // Chuyển sang câu hỏi tiếp theo
    this.currentQuestion = this.questions[this.currentQuestionIndex];
    this.timeLeft = 10; // Đặt lại thời gian cho câu hỏi mới
    this.startTimer(); // Bắt đầu đếm ngược cho câu hỏi mới
  }
  startTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    if (this.timeLeft > 0) {
      this.timerId = setTimeout(() => {
        this.timeLeft--;
        this.startTimer();
      }, 1000);
    }
    if (this.timeLeft <= 0 && !this.quizFinished) {
      console.log('Time is up!');
      this.audioService.playWrong();
      this.showAnswer = true;

      setTimeout(() => {
        this.showAnswer = false;
        this.selectedAnswer = null;
        this.showCorrectAnswer = false;
        this.isCorrect = null;
        this.isNotCorrect = null;

        this.nextQuestion();
      }, this.timeLeft * 1000);
    }
  }
  startCountdown() {
    this.timeLeft = 10;
    this.timerSubscription = timer(0, 1000).subscribe((count) => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.stopCountdown();
        this.closeModal();
      }
    });
  }

  stopCountdown() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe(); // Hủy đếm ngược
      this.timerSubscription = null;
    }
  }

  closeModal() {
    this.finish.emit(); // Phát sự kiện để đóng modal
  }

  ngOnDestroy() {
    this.stopCountdown(); // Hủy đếm ngược khi component bị hủy
  }
}
