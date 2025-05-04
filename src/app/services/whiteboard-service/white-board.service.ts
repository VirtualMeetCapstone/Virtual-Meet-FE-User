import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class WhiteBoardService {
  private url = `${AppConstants.API_BASE_URL_HTTPS}/`;

  constructor(private http: HttpClient) {}
  addAction(roomId: string, action: any) {
    return this.http.post<any>(
      `${this.url}api/whiteboard?roomId=${roomId}`,
      action
    );
  }
}
