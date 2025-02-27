import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoomServicesService {
  private readonly BASE_URL = 'http://dev-vmeet.runasp.net/rooms';

  constructor(private http: HttpClient) {}

  getRooms(top: number, skip: number): any {
    const url = `${this.BASE_URL}?NeedTotalCount=true&Top=${top}&Skip=${skip}`;
    return this.http.get<any>(url);
  }

  deleteRoom(id: string): any {
    const deleteUrl = `${this.BASE_URL}/${id}`;
    return this.http.delete<any>(deleteUrl);
  }
}

