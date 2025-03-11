import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

export interface Media {
  url: string;
  type: number;
  thumbnailUrl: string | null;
}

export interface Story {
  id: string;
  content: string;
  media: Media;
  textContent: string;
  musicUrl: string | null;
  expireTime: number;
  isActive: boolean;
  createTime: number;
  lastModifyTime: number;
}

export interface StoriesResponse {
  data: Story[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class NewsFeedMyProfileService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  getStories(userId: string) {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/stories`;
    return this.http
      .get<StoriesResponse>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // New deleteStory method to call the API to delete a story
  deleteStory(storyId: string) {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}`;
    return this.http
      .delete(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError('Something bad happened; please try again later.');
  }
}
