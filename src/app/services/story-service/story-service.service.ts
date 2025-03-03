import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {catchError, Observable, tap, throwError} from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
import {Viewer} from "../../models/viewer";

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
      const url = `${AppConstants.API_BASE_URL_HTTPS}/users/9508ff30-6a84-4c1d-aa86-bc0813cd05fc/followings/stories`;
      return this.http.get<any>(url, this.httpOptions)
       .pipe(catchError(this.handleError));
    }

    deleteRoom(id: string): any {
      const deleteUrl = `${AppConstants.API_BASE_URL_HTTPS}/stories/${id}`;
      return this.http.delete<any>(deleteUrl);
    }
    private handleError(error: HttpErrorResponse) {

      console.error('An error occurred:', error);


      return throwError('Something bad happened; please try again later.');
    }

  likeStory(userId: string,storyId: string): any {
    const reactionUrl = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}/reactions`;
    return this.http.post<any>(reactionUrl,{"userId": userId},this.httpOptions);
  }

  viewStory(userId: string, storyId: string): any {
    console.log(`viewStory() called with userId: ${userId}, storyId: ${storyId}`);

    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}/views`;
    return this.http.post<any>(url, { "viewerId": userId }, this.httpOptions)
      .pipe(
        tap(() => console.log('API request sent successfully')),
        catchError(error => {
          console.error('Error in viewStory:', error);
          return throwError(error);
        })
      );
  }


  getStoryViewers(storyId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}/views`;
    return this.http.get<Viewer[]>(url, this.httpOptions)
      .pipe(catchError(this.handleError));

  markAsViewed(index: number) {
    this.viewedStories.add(index);
    // console.log("Updated viewedStories:", this.viewedStories);
  }

  isViewed(index: number): boolean {
    return this.viewedStories.has(index);
  }
}
