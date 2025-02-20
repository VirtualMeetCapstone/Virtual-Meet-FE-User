import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  url = 'http://dev-vmeet.runasp.net/rooms';

  constructor(private http: HttpClient) {}

  getRooms(top: number, skip: number): any {
    return this.http.get<any>(this.url + '?Top=' + top + '&Skip=' + skip);
  }
  deleteRoom(id: string): any {
    return this.http.delete<any>(this.url + '/' + id);
  }
}
