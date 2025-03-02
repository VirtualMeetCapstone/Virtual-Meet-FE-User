import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PostserviceService {
  url = 'http://dev-vmeet.runasp.net/posts';

  constructor(private http: HttpClient) {}

  getPosts(top: number, skip: number): any {
    return this.http.get<any>(
      this.url + '?Top=' + top + '&Skip=' + skip + '&needtotalcount=true'
    );
  }
}
