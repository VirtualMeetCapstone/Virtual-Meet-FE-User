import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AppConstants} from "../../constant/AppConstants";
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {
  private newNotification$ = new Subject<any>();
  private refreshNotifications$ = new Subject<void>();
  private postModalTrigger = new Subject<string>();
  private openStorySubject = new Subject<number>();
  openStory$ = this.openStorySubject.asObservable();
  private roomDetailSubject = new Subject<string>(); // Lưu roomId

  roomDetail$ = this.roomDetailSubject.asObservable();
  url = `${AppConstants.API_BASE_URL_HTTPS}/`;

  constructor(private http: HttpClient) {

  }

  getNotificationByUserId(id: string, pageSize: number, skip: number): Observable<Notification> {
    const timestamp = Date.now();
    return this.http.get<Notification>(`${this.url}users/${id}/notifications?Top=${pageSize}&Skip=${skip}&needtotalcount=true&t=${timestamp}`);

  }

  triggerNotificationUpdate() {
    this.refreshNotifications$.next();
  }

  onNotificationUpdate(): Observable<void> {
    return this.refreshNotifications$.asObservable();
  }

  triggerOpenPostModal(postId: string) {
    this.postModalTrigger.next(postId);
  }

  onOpenPostModal(): Observable<string> {
    return this.postModalTrigger.asObservable();
  }

  triggerOpenStory(index: number) {
    this.openStorySubject.next(index);
  }


  openRoomDetail(roomId: string) {
    this.roomDetailSubject.next(roomId);
  }

}
