import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QuizService } from '../../../services/Quiz-service/quiz.service';

@Component({
  selector: 'app-quiz-selection',
  templateUrl: './quiz-selection.component.html',
  styleUrl: './quiz-selection.component.scss',
})
export class QuizSelectionComponent implements OnInit {
  @Output() roomSelected = new EventEmitter<any>();
  @Input() user: any = '';
  @Input() roomId: string = '';
  quiz: any = [];
  ListQuiz: any = [];
  nameInput: string = '';

  constructor(private quizServices: QuizService) {}
  ngOnInit(): void {
    this.ListQuiz = this.quizServices
      .getListQuiz(this.user.id)
      .subscribe((response) => {
        this.ListQuiz = response;
        console.log('ListQuiz:', this.ListQuiz);
      });
  }

  selectRoom(quiz: any, topic: any) {
    const formattedQuiz = [
      {
        quizzes: quiz,
      },
    ];
    console.log('Selected quiz ID:', JSON.stringify(formattedQuiz, null, 2));

    this.roomSelected.emit({ formattedQuiz, topic });
  }
}
