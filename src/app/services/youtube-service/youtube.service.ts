import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class YoutubeService {
  private BASE_URL = `${AppConstants.API_BASE_URL_HTTPS}`;

  constructor(private http: HttpClient) {}

  getTrendingVideos(pageToken: string = ''): Observable<any> {
    const params: any = pageToken ? { pageToken } : {};
    return this.http.get(`${this.BASE_URL}/trending`, { params });
  }

  searchVideos(query: string): Observable<any> {
    return this.http.get(`${this.BASE_URL}/search`, {
      params: { q: query },
    });
  }
}
