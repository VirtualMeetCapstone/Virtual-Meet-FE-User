import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  url = 'http://dev-vmeet.runasp.net/rooms';

  constructor(private http: HttpClient) {}

  getRooms(top: number, skip: number): any {
    return this.http.get<any>(
      this.url + '?Top=' + top + '&Skip=' + skip + '&needtotalcount=true'
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
}
