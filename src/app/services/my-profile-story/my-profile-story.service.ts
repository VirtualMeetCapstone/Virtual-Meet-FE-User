import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import { catchError, map, throwError } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MyProfileStoryService {
  constructor(private http: HttpClient) {}
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  viewedStories: Set<string> = new Set();
  getMyProfileStories(userId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/stories`;

    return this.http.get<any>(url, this.httpOptions).pipe(
      map((response) => response.data),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);

    return throwError('Something bad happened; please try again later.');
  }

  markAsViewed(userId: string): void {
    this.viewedStories.add(userId);
  }

  isViewed(userId: string): boolean {
    return this.viewedStories.has(userId);
  }
}
