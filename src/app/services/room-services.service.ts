import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from '../constant/AppConstants';
@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  url = `${AppConstants.API_BASE_URL_HTTPS}/rooms`;

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
  addRoom(room: any): any {
    const formData = new FormData();
    formData.append('OwnerId', 'db04dba2-5640-4cd8-a5a9-119b429f2b32');
    formData.append('Topic', room.topic);
    formData.append('Description', room.description);
    formData.append('MaximumMembers', room.maximumMember.toString());

    // Kiểm tra và thêm file đúng cách
    if (room.mediaUpload instanceof File) {
      formData.append('MediaUploads', room.mediaUpload, room.mediaUpload.name);
    }

    return this.http.post<any>(this.url, formData);
  }
  updateRoom(id: any, room: any): any {
    const formData = new FormData();
    formData.append('OwnerId', 'db04dba2-5640-4cd8-a5a9-119b429f2b32');
    formData.append('Topic', room.topic);
    formData.append('Description', room.description);
    formData.append('MaximumMembers', room.maximumMember.toString());

    if (room.mediaUpload instanceof File) {
      formData.append('MediaUploads', room.mediaUpload, room.mediaUpload.name);
    } else if (typeof room.mediaUpload === 'string') {
      formData.append('MediaUrl', room.mediaUpload); // Giữ URL ảnh cũ
    }

    console.log(formData);

    return this.http.patch<any>(this.url + '/' + id, formData);
  }
}
