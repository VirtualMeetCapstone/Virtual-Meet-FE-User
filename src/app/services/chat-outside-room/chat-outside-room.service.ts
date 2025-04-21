import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth-service/auth.service';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class ChatOutsideRoomService {
  url = `${AppConstants.API_BASE_URL_HTTPS}/api/MessagesOutsideRoom`;
  private hubUrl = `${AppConstants.API_BASE_URL_HTTPS}/chatOutsideRoomHub`;
  user: any = null;
  private hubConnection!: signalR.HubConnection;
  constructor(private http: HttpClient, private authService: AuthService) {
    this.initConnection();
  }

  public messageReceived$ = new BehaviorSubject<{
    user: string;
    message: string;
  } | null>(null);

  public userIsTyping$ = new BehaviorSubject<{
    user: string;
  } | null>(null);

  private initConnection(): void {
    this.user = this.authService.getUser();
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .build();
    this.hubConnection.start().then(() => {
      console.log('SignalR Connected');
      // Join group with userId
      this.hubConnection.invoke('AddToGroup', this.user.id);
    });
    this.hubConnection.on(
      'ReceivePrivateMessage',
      (user: string, message: string) => {
        this.messageReceived$.next({ user, message });
      }
    );

    this.hubConnection.on('UserTyping', (user: string) => {
      this.userIsTyping$.next({ user });
    });
  }
  getChatHistory(Userid: any) {
    return this.http.get<any>(`${this.url}/chat-history/${Userid}`);
  }
  getChatWithUser(userlogged: any, user2: any) {
    return this.http.get<any>(
      `${this.url}/private/${userlogged}/${user2}/?page=1&pageSize=50`
    );
  }
  sendPrivateMessage(data: any) {
    // Return the HTTP observable
    return this.http.post<any>(`${this.url}/send`, data).pipe(
      tap(() => {
        this.hubConnection
          .invoke(
            'SendPrivateMessage',
            data.senderId,
            data.receiverId,
            data.content
          )
          .catch((err) => console.error('SendMessage Error:', err));
      })
    );
  }
  userIsTyping(receiverId: string, senderId: string) {
    return this.hubConnection
      .invoke('UserIsTyping', receiverId, senderId)
      .catch((err) => console.error('SendMessage Error:', err));
  }
}
