import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private url =  `${AppConstants.API_BASE_URL_HTTPS}`;

  public rooms = [
    { id: 'room1', name: 'General Knowledge', players: 0 },
    { id: 'room2', name: 'Science & Technology', players: 0 },
    { id: 'room3', name: 'History & Geography', players: 0 },
  ];
  private hubConnection!: signalR.HubConnection;
  public quizStarted$ = new Subject<void>();
  public playerJoined$ = new Subject<void>();
  public answer$ = new Subject<void>();
  public quizUpdated$ = new Subject<{ topic: any; sessionQuizId: any }>();
  public connectionState$ = new BehaviorSubject<string>('Disconnected');
  public closeQuiz$ = new Subject<void>();
  constructor(private http: HttpClient) {}

  startConnection(roomId: string) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.url}/quizhub`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.connectionState$.next('Connected');
        this.hubConnection.invoke('AddToGroup', roomId);

        console.log('SignalR Connected');
      })
      .catch((err) => {
        this.connectionState$.next('Disconnected');
        console.error('SignalR Connection Error:', err);
      });

    this.hubConnection.on('Join successful', () => {
      this.playerJoined$.next();
    });
    this.hubConnection.on('Quiz Update', (topic: any, sessionQuizId: any) => {
      console.log('Quiz Update received:', { topic, sessionQuizId });
      this.quizUpdated$.next({ topic, sessionQuizId }); // Truyền dữ liệu qua Subject
    });
    this.hubConnection.on('Start quiz', () => {
      this.quizStarted$.next();
    });
    this.hubConnection.on('Someone just answered the question', () => {
      this.answer$.next();
    });
    this.hubConnection.on('Close Quiz', () => {
      this.closeQuiz$.next();
    });
  }

  public async joinQuiz(roomId: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinQuiz', roomId);
    } else {
      const sub = this.connectionState$.subscribe(async (state) => {
        if (state === 'Connected') {
          await this.hubConnection.invoke('JoinQuiz', roomId);
          sub.unsubscribe();
        }
      });
    }
  }

  public async startQuiz(roomId: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('StartQuiz', roomId);
    } else {
      const sub = this.connectionState$.subscribe(async (state) => {
        if (state === 'Connected') {
          await this.hubConnection.invoke('StartQuiz', roomId);
          sub.unsubscribe();
        }
      });
    }
  }
  public async quizUpdate(
    roomId: string,
    topic: string,
    sessionQuizId: string
  ) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke(
        'ChooseQuiz',
        roomId,
        topic,
        sessionQuizId
      );
    } else {
      const sub = this.connectionState$.subscribe(async (state) => {
        if (state === 'Connected') {
          await this.hubConnection.invoke('ChooseQuiz', roomId);
          sub.unsubscribe();
        }
      });
    }
  }
  getListPlayer(roomId: string) {
    return this.http.get<any>(`${this.url}/getPlayerByRoomSessionId/${roomId}`);
  }
  addPlayer(data: any, roomId: string) {
    return this.http.post<any>(`${this.url}/addPlayer`, data).pipe(
      tap(() => {
        this.hubConnection
          .invoke('JoinQuiz', roomId)
          .catch((err) => console.error('join error:', err));
      })
    );
  }
  addScore(data: any, roomId: string) {
    return this.http.post<any>(`${this.url}/addScore`, data).pipe(
      tap(() => {
        this.hubConnection
          .invoke('SelectAsnwer', roomId)
          .catch((err) => console.error('join error:', err));
      })
    );
  }
  getListQuiz(userId: string) {
    return this.http.get<any>(`${this.url}/getListQuizOfUser/${userId}`);
  }
  addSessionQuiz(quiz: any) {
    return this.http.post<any>(`${this.url}/addRoomSession`, quiz, {
      headers: { 'Content-Type': 'application/json' }, // Đặt Content-Type
    });
  }
  getSessionQuiz(quizId: string) {
    return this.http.get<any>(`${this.url}/getRoomSession/${quizId}`);
  }
  closeQuiz(roomId: string) {
    this.hubConnection
      .invoke('closeQuiz', roomId)
      .catch((err) => console.error('join error:', err));
  }

  addQuiz(quiz: any) {
    return this.http.post(`${this.url}/addListQuiz`, quiz);
  }

  updateQuiz(quizId: string, updatedQuiz: any) {
    return this.http.put(`${this.url}/updateQuiz/${quizId}`, updatedQuiz);
  }

  deleteQuiz(quizId: string) {
    return this.http.delete(`${this.url}/deleteQuiz/${quizId}`);
  }
}
