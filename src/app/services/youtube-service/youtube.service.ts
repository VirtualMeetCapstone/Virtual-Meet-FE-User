import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class YoutubeService {
  private API_KEY = 'AIzaSyBov6HYaR6Z-2lswDDxggMYmOJM7wuw1Uo'; // Thay bằng API Key của bạn
  private API_URL = 'https://www.googleapis.com/youtube/v3/videos';
  private SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
  constructor(private http: HttpClient) {}
  private isApiLoaded = false;

  getTrendingVideos(pageToken: string = ''): Observable<any> {
    let params: any = {
      part: 'snippet',
      chart: 'mostPopular',
      regionCode: 'VN',
      maxResults: '10',
      key: this.API_KEY,
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    return this.http.get(this.API_URL, { params });
  }


  searchVideos(query: string): Observable<any> {
    return this.http.get(this.SEARCH_URL, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '10',
        key: this.API_KEY,
      },
    });
}
}
