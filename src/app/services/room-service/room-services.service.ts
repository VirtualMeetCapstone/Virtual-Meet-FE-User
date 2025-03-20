import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  url = 'https://dev-vmeet.site/rooms';

  constructor(private http: HttpClient) {}

  getRooms(top: number, skip: number): any {
    const timestamp = Date.now();
    return this.http.get<any>(
      `${this.url}?Top=${top}&Skip=${skip}&needtotalcount=true&t=${timestamp}`
    );
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
    });
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
