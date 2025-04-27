import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { QuizService } from '../../../services/Quiz-service/quiz.service';
@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit, OnDestroy {
  @Input() user: any = '';
  @Input() roomId: string = '';
  @Input() QuizSessionId: any;
  @Output() startQuiz = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Input() topic: string = '';
  @Input() isHost: boolean = false;
  players: any = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private signalrService: QuizService,
    private snackBar: MatSnackBar
  ) {
    this.signalrService.startConnection(this.roomId);
    this.isHost = true;
  }

  ngOnInit() {
    console.log('Room ID:', this.roomId);
    console.log('User:', this.user);

    const dataAddPlayer = {
      quizSessionId: this.QuizSessionId,
      player: {
        id: this.user.id,
        name: this.user.name,
      },
    };
    this.signalrService.addPlayer(dataAddPlayer, this.roomId).subscribe();

    // Lấy danh sách người chơi
    this.signalrService.getSessionQuiz(this.QuizSessionId).subscribe(
      (response) => {
        this.players = response.players;
        console.log('Players:', this.players);
      },
      (error) => {
        console.error('Error fetching session quiz:', error);
      }
    );
    this.signalrService.playerJoined$.subscribe(() => {
      this.signalrService.getSessionQuiz(this.QuizSessionId).subscribe(
        (response) => {
          this.players = response.players;
        },
        (error) => {
          console.error('Error fetching session quiz:', error);
        }
      );
    });
    this.signalrService.quizStarted$.subscribe(() => {
      this.startQuiz.emit();
    });
  }

  startQuizz() {
    this.signalrService.startQuiz(this.roomId);
    this.startQuiz.emit();
  }
  goBack() {
    this.back.emit();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
