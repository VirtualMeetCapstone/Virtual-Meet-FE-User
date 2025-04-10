import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class DeleteAccountService {
  constructor(private http: HttpClient) {}

  deleteAccount(id: string): Observable<any> {
    const token = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete(`${AppConstants.API_BASE_URL_HTTPS}/users/${id}`, {
      headers,
    });
  }
}
