import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  url = 'http://dev-vmeet.runasp.net/rooms';
  constructor(private Httpservice: HttpClient) {}
  getRooms(): any {
    return this.Httpservice.get<any>(this.url);
  }
}
