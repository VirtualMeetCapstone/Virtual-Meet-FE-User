import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { QuizService } from '../../../services/Quiz-service/quiz.service';
import { AuthService } from '../../../services/auth-service/auth.service';

@Component({
  selector: 'app-quiz-questions',
  templateUrl: './quiz-questions.component.html',
  styleUrls: ['./quiz-questions.component.scss'],
})
export class QuizQuestionsComponent implements OnInit {
  quizzes: any[] = [];
  selectedQuiz: any = null;
  quizForm: FormGroup;
  isEditing: boolean = false;
  userId: string = '';

  constructor(
    private quizService: QuizService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.quizForm = this.fb.group({
      topic: ['', Validators.required],
      questions: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.authService.loggedIn$.subscribe((status: boolean) => {
      if (status) {
        this.userId = this.authService.getUser().id;
        this.getQuizzes();
      }
    });
  }

  get questionsArray(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptionsArray(question: AbstractControl | null): FormArray {
    return question?.get('options') as FormArray;
  }

  getQuizzes() {
    this.quizService.getListQuiz(this.userId).subscribe(
      (response: any) => {
        console.log('Quizzes:', response);
        if (Array.isArray(response)) {
          this.quizzes = response.map((quiz: any) => ({
            quizId: quiz.quizId,
            topic: quiz.topic,
            questions: Array.isArray(quiz.quizzes) ? quiz.quizzes : [],
          }));
        } else {
          console.error('Response is not an array:', response);
        }
      },
      (error) => {
        console.error('Error fetching quizzes:', error);
      }
    );
  }

  startAddQuiz() {
    this.isEditing = true;
    this.selectedQuiz = null; // Không chọn quiz nào
    this.quizForm.reset(); // Reset form
    this.questionsArray.clear(); // Xóa các câu hỏi hiện tại
  }

  addQuiz() {
    if (this.quizForm.valid) {
      const payload = {
        quizzes: this.questionsArray.value,
        userId: this.userId,
        topic: this.quizForm.get('topic')?.value,
      };

      this.quizService.addQuiz(payload).subscribe(
        (response: any) => {
          this.quizzes.push(response);
          this.getQuizzes();

          this.cancelEdit();
        },
        (error) => {
          console.error('Error adding quiz:', error);
        }
      );
    }
  }

  editQuiz(quiz: any) {
    this.isEditing = true;
    this.selectedQuiz = quiz;

    this.quizForm.patchValue({
      topic: quiz.topic,
    });

    this.questionsArray.clear();

    if (Array.isArray(quiz.questions)) {
      quiz.questions.forEach((q: any) => {
        const optionsArray = this.fb.array([]);
        if (Array.isArray(q.options)) {
          q.options.forEach((option: string) => {
            optionsArray.push(this.fb.control(option, Validators.required));
          });
        }

        this.questionsArray.push(
          this.fb.group({
            text: [q.text, Validators.required],
            options: optionsArray,
            correctAnswer: [q.correctAnswer, Validators.required],
            points: [q.points, Validators.required],
          })
        );
      });
    } else {
      console.error(
        'quiz.questions is not an array or is undefined:',
        quiz.questions
      );
    }
  }

  updateQuiz() {
    if (this.quizForm.valid && this.selectedQuiz) {
      const payload = {
        quizzes: this.questionsArray.value,
        userId: this.userId,
        topic: this.quizForm.get('topic')?.value,
        quizId: this.selectedQuiz.quizId,
      };

      this.quizService.updateQuiz(this.selectedQuiz.quizId, payload).subscribe(
        () => {
          this.getQuizzes();
          this.cancelEdit();
        },
        (error) => {
          console.error('Error updating quiz:', error);
        }
      );
    }
  }

  deleteQuiz(quizId: string) {
    this.quizService.deleteQuiz(quizId).subscribe(
      () => {
        this.getQuizzes();
      },
      (error) => {
        this.getQuizzes();
      }
    );
  }

  addQuestion() {
    this.questionsArray.push(
      this.fb.group({
        text: ['', Validators.required],
        options: this.fb.array(['', '', '', '']),
        correctAnswer: [1, Validators.required],
        points: [1000, Validators.required],
      })
    );
  }

  removeQuestion(index: number) {
    this.questionsArray.removeAt(index);
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedQuiz = null;
    this.quizForm.reset();
    this.questionsArray.clear();
  }
  addOption(questionIndex: number) {
    const question = this.questionsArray.at(questionIndex);
    const optionsArray = question.get('options') as FormArray;
    optionsArray.push(this.fb.control('', Validators.required));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const question = this.questionsArray.at(questionIndex);
    const optionsArray = question.get('options') as FormArray;
    optionsArray.removeAt(optionIndex);
  }
  setCorrectOption(questionIndex: number, optionIndex: number) {
    const question = this.questionsArray.at(questionIndex);
    question.get('correctAnswer')?.setValue(optionIndex); // Cập nhật giá trị correctAnswer
  }
}
