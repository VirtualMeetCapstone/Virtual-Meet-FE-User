import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, tap } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth-service/auth.service';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class ChatOutsideRoomService {
  url = `https://dev-vmeet2.runasp.net/api/MessagesOutsideRoom`;
  private hubUrl = `${AppConstants.API_BASE_URL_HTTPS}/chatOutsideRoomHub`;
  user: any = null;
  private hubConnection!: signalR.HubConnection;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object // inject platformId
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initConnection();
    }
  }

  public messageReceived$ = new BehaviorSubject<{
    user: string;
    message: string;
  } | null>(null);

  public userIsTyping$ = new BehaviorSubject<{
    user: string;
  } | null>(null);
  public countMessageUnread$ = new BehaviorSubject<number>(0);
  private initConnection(): void {
    this.user = this.authService.getUser();
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connected');
        // Join group with userId
        this.hubConnection.invoke('AddToGroup', this.user.id);
      })
      .catch((err) => console.error('SignalR Connection Error:', err));

    this.hubConnection.on(
      'ReceivePrivateMessage',
      (user: string, message: string) => {
        this.messageReceived$.next({ user, message });
        this.updateUnreadMessagesCount(); // Cập nhật số lượng tin nhắn chưa đọc
      }
    );

    this.hubConnection.on('UserTyping', (user: string) => {
      this.userIsTyping$.next({ user });
    });
    this.countUnread(this.user.id).subscribe((data) => {
      this.countMessageUnread$.next(data);
    });
  }
  countUnread(Userid: string) {
    return this.http.get<number>(`${this.url}/GetQuantityNotRead/${Userid}`);
  }

  updateUnreadMessagesCount(): void {
    if (this.user?.id) {
      this.countUnread(this.user.id).subscribe((count: number) => {
        this.countMessageUnread$.next(count); // Cập nhật giá trị mới
      });
    }
  }
  getChatHistory(Userid: any) {
    return this.http.get<any>(`${this.url}/chat-history/${Userid}`);
  }

  markRead(senderId: string, receiverId: string) {
    return this.http.post<any>(`${this.url}/mark-last-message-as-read`, {
      senderId: senderId,
      receiverId: receiverId,
    });
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
