import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';
import { QuizService } from '../../services/Quiz-service/quiz.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit {
  state: 'confirm' | 'not' | 'quiz-selection' | 'lobby' | 'play-quiz' =
    'quiz-selection';
  @Input() roomId: string = '';
  quiz: any = [];
  user: any = '';
  QuizSessionId: any = '';
  @Input() isHost: boolean = false;
  topic: string = '';
  questions: any = [];
  constructor(
    private authService: AuthService,
    private quizServices: QuizService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.state = 'not';
      this.quizServices.startConnection(this.roomId);
      this.authService.loggedIn$.subscribe((status: boolean) => {
        if (status) {
          this.user = this.authService.getUser();

          console.log('User ID:', this.user);
        }
      });
      this.quizServices.quizUpdated$.subscribe((data) => {
        this.topic = data.topic;
        this.QuizSessionId = data.sessionQuizId;
        this.quizServices
          .getSessionQuiz(this.QuizSessionId)
          .subscribe((response) => {
            this.questions = response.quizzes[0].quizzes;
          });
        if (!this.isHost) {
          this.state = 'confirm'; // Chuyển sang trạng thái lobby khi có cập nhật quiz
        }
      });
      this.quizServices.closeQuiz$.subscribe(() => {
        this.closeModalForMember();
      });
    }
  }

  // Chuyển sang trạng thái lobby
  goToLobby(event: { formattedQuiz: any; quiz: any }) {
    console.log(
      'Formatted quiz:',
      JSON.stringify(event.formattedQuiz, null, 2)
    );

    this.topic = event.quiz.topic;
    let formattedQuiz = event.formattedQuiz;
    formattedQuiz.topic = event.quiz.topic;
    formattedQuiz.quizId = event.quiz.quizId;

    if (this.isHost) {
      this.quizServices.addSessionQuiz(event.formattedQuiz).subscribe(
        (response) => {
          this.QuizSessionId = response.quizSessionId;
          this.questions = response.quizzes[0].quizzes;
          console.log('QuizSessionId:', response);
          console.log('Quessions:', this.questions);

          this.quizServices.quizUpdate(
            this.roomId,
            this.topic,
            this.QuizSessionId
          );

          this.state = 'lobby'; // Chuyển host sang lobby
        },
        (error) => {
          console.error('Error adding session quiz:', error);
        }
      );
    }
  }
  confirmJoin() {
    this.state = 'lobby';
  }
  cancelJoin() {
    this.state = 'not';
  }

  // Chuyển sang trạng thái play-quiz
  startQuiz() {
    this.state = 'play-quiz';
  }

  // Quay lại trạng thái quiz-selection
  backToSelection() {
    this.state = 'quiz-selection';
  }

  closeModal() {
    this.quizServices.closeQuiz(this.roomId);
    this.state = 'not';
    this.topic = '';
    this.QuizSessionId = '';
    this.quiz = [];
    this.questions = []; // Đặt lại danh sách câu hỏi về trạng thái ban đầu
  }
  closeModalForMember() {
    this.state = 'not';
    this.topic = '';
    this.QuizSessionId = '';
    this.quiz = [];
    this.questions = []; // Đặt lại danh sách câu hỏi về trạng thái ban đầu
  }
  // Kết thúc quiz và quay lại trạng thái ban đầu
  finishQuiz() {
    this.state = 'quiz-selection';
  }
  openSelectionQuiz() {
    this.state = 'quiz-selection'; // Đóng modal và quay lại trạng thái mặc định
  }
}
