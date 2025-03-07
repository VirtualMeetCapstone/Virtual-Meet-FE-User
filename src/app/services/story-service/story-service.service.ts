import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {catchError, tap, throwError} from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
import {Viewer} from "../../models/viewer";
import {Reaction} from "../../models/reaction";

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
      const url = `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/followings/stories`;
      return this.http.get<any>(url, this.httpOptions)
       .pipe(catchError(this.handleError));
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
  }
  getStoryReaction(storyId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/stories/${storyId}/reactions`;
    return this.http.get<Reaction[]>(url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
    markAsViewed(index: number) {
      this.viewedStories.add(index);
      // console.log("Updated viewedStories:", this.viewedStories);
    }
  isViewed(index: number): boolean {
      if(this.viewedStories)
      {
        return this.viewedStories.has(index);
      }
      return false;
  }

}

