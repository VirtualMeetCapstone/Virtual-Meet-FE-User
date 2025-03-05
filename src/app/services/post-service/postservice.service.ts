import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
@Injectable({
  providedIn: 'root',
})
export class PostserviceService {
  url = `${AppConstants.API_BASE_URL_HTTPS}/users/posts`;

  constructor(private http: HttpClient) {}

  getPosts(top: number, skip: number): any {
    return this.http.get<any>(
      this.url + '?Top=' + top + '&Skip=' + skip + '&needtotalcount=true'
    );
  }
}
