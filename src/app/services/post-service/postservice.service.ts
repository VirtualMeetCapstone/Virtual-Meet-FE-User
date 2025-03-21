import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConstants} from '../../constant/AppConstants';
import {Observable, tap} from 'rxjs';
import {AuthService} from '../auth-service/auth.service';
import {NotificationServiceService} from "../notification-service/notification-service.service";

@Injectable({
  providedIn: 'root',
})
export class PostserviceService {
  url = `${AppConstants.API_BASE_URL_HTTPS}/posts`;

  private httpOptions = {
    headers: new HttpHeaders({
      Accept: 'application/json',
    }),
  };

  constructor(private http: HttpClient, private authService: AuthService, private notificationService: NotificationServiceService) {
  }

  userId = this.authService.getUser()?.id as string;

  getPosts(top: number, skip: number): any {
    const timestamp = Date.now();
    return this.http.get<any>(
      `${this.url}?Top=${top}&Skip=${skip}&needtotalcount=true&t=${timestamp}`
    );
  }

  getPostById(id: string): any {
    return this.http.get<any>(this.url + '/' + id);
  }

  getComment(idPost: string): any {
    return this.http.get<any>(
      this.url + '/' + idPost + '/comments?OrderType=0&OrderBy=createTime'
    );
  }

  createPost(
    content: string,
    privacy: number,
    reactionType?: number,
    postMedia?: File[]
  ): Observable<any> {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/posts`;
    const formData = new FormData();
    formData.append('userId', this.userId);
    formData.append('content', content);
    formData.append('privacy', privacy.toString());

    if (reactionType !== undefined) {
      formData.append('reactionType', reactionType.toString());
    }

    if (postMedia) {
      postMedia.forEach((file, index) => {
        formData.append(`mediaUploads`, file);
        console.log(file);
      });
    }

    return this.http.post<any>(url, formData).pipe(
      tap(() => {
        this.notificationService.triggerNotificationUpdate(); // Gửi sự kiện cập nhật thông báo
      })
    );;
  }

  commentPost(idUser: any, idPost: string, content: string) {
    const body = {
      authorId: idUser,
      content: content,
    };

    return this.http.post<any>(this.url + '/' + idPost + '/comments', body, {
      headers: {'Content-Type': 'application/json'},
    }).pipe(
      tap(() => {
        this.notificationService.triggerNotificationUpdate(); // Gửi sự kiện cập nhật thông báo
      })
    );
    ;
  }

  replyComment(idUser: any, idPost: string, parentId: string, content: string) {
    const body = {
      authorId: idUser,
      parentId: parentId,
      content: content,
    };

    return this.http.post<any>(this.url + '/' + idPost + '/comments', body, {
      headers: {'Content-Type': 'application/json'},
    }).pipe(
      tap(() => {
        this.notificationService.triggerNotificationUpdate(); // Gửi sự kiện cập nhật thông báo
      })
    );
  }
}
