import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import {
  BehaviorSubject,
  catchError,
  Observable,
  Subject,
  tap,
  throwError,
} from 'rxjs';
import * as signalR from '@microsoft/signalr';

import { NotificationServiceService } from '../notification-service/notification-service.service';
import { Room } from '../../models/room';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  public updateStatus$ = new BehaviorSubject<any>('');
  url = `${AppConstants.API_BASE_URL_HTTPS}/rooms`;
  urlHub = `${AppConstants.API_BASE_URL_HTTPS}/statusHub`;
  private hubConnection!: signalR.HubConnection;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationServiceService,
    private router: Router
  ) {}
  private refreshRoomSource = new Subject<void>();
  refreshRoom$ = this.refreshRoomSource.asObservable();
  public initConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.urlHub, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connected');
      })
      .catch((err) => {
        console.error('SignalR Connection Error:', err);
      });
    this.hubConnection.on('Just updated status', (message: any) => {
      this.updateStatus$.next(message);
    });
  }
  triggerRefresh() {
    this.refreshRoomSource.next();
  }

  getRooms(top: number, skip: number): any {
    const urlWithParams = `${this.url}?Top=${top}&Skip=${skip}&needtotalcount=true`;
    const finalUrl = AppConstants.addTimeStampUrl(urlWithParams);
    return this.http.get<any>(finalUrl);
  }
  getRoomsNotNeedCount(top: number, skip: number): any {
    const urlWithParams = `${this.url}?Top=${top}&Skip=${skip}`;
    const finalUrl = AppConstants.addTimeStampUrl(urlWithParams);
    return this.http.get<any>(finalUrl);
  }

  deleteRoom(id: string): any {
    return this.http.delete<any>(this.url + '/' + id).pipe(
      tap(() => {
        this.hubConnection.invoke('UpdateStatus').catch((err) => {
          console.error('Error joining group:', err);
        });
      })
    );
  }
  addRoom(room: any, iduser: any, password: string): any {
    const body: any = {
      OwnerId: iduser,
      Topic: room.topic,
      Description: room.description,
      MaximumMembers: room.maximumMember,
      Medias: room.mediaUpload
        ? [
            {
              url: room.mediaUpload,
              type: 0,
              thumbnailUrl: '',
            },
          ]
        : [],
    };
    if (password) {
      body.password = password;
      body.privacy = 1;
    }
    console.log(body);
    return this.http
      .post<any>(this.url, body, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        tap(() => {
          this.notificationService.triggerNotificationUpdate(); // Gửi sự kiện cập nhật thông báo
          this.hubConnection.invoke('UpdateStatus').catch((err) => {
            console.error('Error joining group:', err);
          });
        })
      );
  }
  uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('medias', file);

    return this.http.post<{ url: string }>(
      `${AppConstants.API_BASE_URL_HTTPS}/medias`,
      formData
    );
  }
  updateRoom(
    id: any,
    room: any,
    iduser: any,
    isPrivacy: any,
    password: any
  ): any {
    const body: any = {
      OwnerId: iduser,
      Topic: room.topic,
      Description: room.description,
      MaximumMembers: room.maximumMember,
      Medias: room.mediaUpload
        ? [
            {
              url: room.mediaUpload,
              type: 0,
              thumbnailUrl: '',
            },
          ]
        : [],
    };
    if (password) {
      body.password = password;
    }
    body.privacy = +isPrivacy;

    return this.http
      .patch<any>(this.url + '/' + id, body, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        tap(() => {
          this.hubConnection.invoke('UpdateStatus').catch((err) => {
            console.error('Error joining group:', err);
          });
        })
      );
  }
  getRoomById(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.url}/${id}`).pipe(
      catchError((error) => {
        console.error('Error fetching room:', error);
        this.router.navigate(['/not-found']); // Điều hướng tới trang not-found
        return throwError(() => new Error('Room not found'));
      })
    );
  }

  checkInput(text: string): Observable<any> {
    const apiUrl = `${AppConstants.API_BASE_URL_HTTPS}/moderation/check`;
    const payload = { text };

    return this.http.post<any>(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
