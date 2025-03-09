import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
import { Viewer } from '../../models/viewer';
import { Reaction } from '../../models/reaction';

@Injectable({
  providedIn: 'root',
})
export class StoryServiceService {
  constructor(private http: HttpClient) {}
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  viewedStories: Set<number> = new Set();

  getStories(userId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${userId}/friends`;
    return this.http
      .get<any>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteRoom(id: string): any {
    const deleteUrl = `${AppConstants.API_BASE_URL_HTTPS}/stories/${id}`;
    return this.http.delete<any>(deleteUrl);
  }
  /**
   * Handles an error by logging it to the console and rethrowing
   * an error with a user-friendly message.
   *
   * @param error The error to handle.
   * @returns An observable that throws an error.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);

    return throwError('Something bad happened; please try again later.');
  }

  getStoryViewers(storyId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}/views`;
    return this.http
      .get<Viewer[]>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  getStoryReaction(storyId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}/reactions`;
    return this.http
      .get<Reaction[]>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  markAsViewed(index: number) {
    this.viewedStories.add(index);
    // console.log("Updated viewedStories:", this.viewedStories);
  }
  isViewed(index: number): boolean {
    if (this.viewedStories) {
      return this.viewedStories.has(index);
    }
    return false;
  }
}
