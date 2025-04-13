// postservice.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
import { AuthService } from '../auth-service/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PostserviceService {
  private url = `${AppConstants.API_BASE_URL_HTTPS}/posts`;
  private reactUrl = `${AppConstants.API_BASE_URL_HTTPS}/posts/react`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  createPost(
    content: string,
    privacy: number,
    reactionType?: number,
    postMedia?: File[]
  ): Observable<any> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }
    const formData = new FormData();
    formData.append('UserId', userId);
    formData.append('Content', content); // Capitalized 'C'
    formData.append('Privacy', privacy.toString()); // Capitalized 'P'

    if (reactionType !== undefined) {
      formData.append('ReactionType', reactionType.toString()); // Assuming server expects 'ReactionType'
    }

    if (postMedia && postMedia.length > 0) {
      postMedia.forEach((file) => {
        formData.append('MediaUploads', file); // Corrected to 'MediaUploads' without '[]'
      });
    }

    return this.http.post<any>(this.url, formData);
  }

  getPosts(top: number, skip: number): Observable<any> {
    const timestamp = Date.now();
    return this.http.get<any>(
      `${this.url}?Top=${top}&Skip=${skip}&needtotalcount=true&t=${timestamp}`
    );
  }

  getPostsNotNeedTotalCount(top: number, skip: number): Observable<any> {
    const timestamp = Date.now();
    return this.http.get<any>(
      `${this.url}?Top=${top}&Skip=${skip}&t=${timestamp}`
    );
  }

  // Assuming getPostById exists, as it’s used in your component
  getPostById(postId: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${postId}`);
  }

  setReaction(postId: string, reactionType: number): Observable<any> {
    const userId = this.authService.getUser()?.id;
    const body = { postId, userId, type: reactionType };
    return this.http.post<any>(this.reactUrl, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    });
  }

  getUserReactions(postId: string): Observable<any> {
    return this.http.get<any>(`${this.url}/users-reaction/${postId}`);
  }

  getComment(postId: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${postId}/comments`);
  }

  commentPost(
    userId: string,
    postId: string,
    content: string
  ): Observable<any> {
    const body = { authorId: userId, content };
    return this.http.post<any>(`${this.url}/${postId}/comments`, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    });
  }
  replyComment(
    userId: string,
    postId: string,
    parentId: string,
    content: string
  ): Observable<any> {
    const body = { authorId: userId, parentId, content };
    return this.http.post<any>(`${this.url}/${postId}/comments`, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    });
  }
  deletePost(id: string): any {
    return this.http.delete<any>(this.url + '/' + id);
  }
}
