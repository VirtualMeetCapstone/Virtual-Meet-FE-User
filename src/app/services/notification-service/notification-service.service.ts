import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AppConstants} from "../../constant/AppConstants";
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {
  private newNotification$ = new Subject<any>();
  private refreshNotifications$ = new Subject<void>();

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

}
