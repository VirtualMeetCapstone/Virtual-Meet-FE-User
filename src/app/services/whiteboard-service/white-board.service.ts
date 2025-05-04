import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WhiteBoardService {
  private url = `https://dev-vmeet2.runasp.net/`;

  constructor(private http: HttpClient) {}
  addAction(roomId: string, action: any) {
    return this.http.post<any>(
      `${this.url}api/whiteboard?roomId=${roomId}`,
      action
    );
  }
}
