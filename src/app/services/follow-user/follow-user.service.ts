import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class FollowUserService {
  constructor(private http: HttpClient) {}

  // API tự động toggle giữa follow/unfollow
  followUser(followingId: string, followerId: string): Observable<any> {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/follow`;
    const body = { followingId, followerId };
    return this.http.post(url, body);
  }

  blockUser(blockedUserId: string, blockedByUserId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/block`;
    const body = { blockedUserId, blockedByUserId };
    return this.http.post(url, body);
  }
  viewListBlockedByUser(userId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/blocked`;
    return this.http.get<any>(url);
  }
  ViewListPeopleBlockedUser(userId: string): any {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/blocked-by/${userId}`;
    return this.http.get<any>(url);
  }
}
