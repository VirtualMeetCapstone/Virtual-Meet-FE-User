import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import {tap} from "rxjs";
import {NotificationServiceService} from "../notification-service/notification-service.service";
@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  url = 'https://dev-vmeet.site/rooms';

  constructor(private http: HttpClient, private notificationService: NotificationServiceService) {}

  getRooms(top: number, skip: number): any {
    const urlWithParams = `${this.url}?Top=${top}&Skip=${skip}&needtotalcount=true`;
    const finalUrl = AppConstants.addTimeStampUrl(urlWithParams);
    return this.http.get<any>(finalUrl);
  }

  deleteRoom(id: string): any {
    return this.http.delete<any>(this.url + '/' + id);
  }
  addRoom(room: any, iduser: any): any {
    const body = {
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

    return this.http.post<any>(this.url, body, {
      headers: { 'Content-Type': 'application/json' },
    }).pipe(
      tap(() => {
        this.notificationService.triggerNotificationUpdate(); // Gửi sự kiện cập nhật thông báo
      })
    );
  }
  uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('medias', file);

    return this.http.post<{ url: string }>(
      'https://dev-vmeet.site/medias',
      formData
    );
  }
  updateRoom(id: any, room: any, iduser: any): any {
    const body = {
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

    return this.http.patch<any>(this.url + '/' + id, body, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
