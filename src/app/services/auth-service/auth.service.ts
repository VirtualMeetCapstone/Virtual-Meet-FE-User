import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ Kiểm tra đang chạy trên trình duyệt hay không
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // ✅ Lấy token từ localStorage
  getToken(): string {
    return this.isBrowser() ? localStorage.getItem('accessToken') || '' : '';
  }
  setToken(token: string) {
    if (this.isBrowser()) {
      localStorage.setItem('accessToken', token);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): any {
    const token = this.getToken();
    if (!token) return null;

    return this.getUserFromToken();
  }

  getUserFromToken(): any {
    const token = this.getToken();

    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      let photoUrl = decoded.picture || null;

      if (!photoUrl && decoded.Picture) {
        try {
          photoUrl = JSON.parse(decoded.Picture)?.Url || null;
        } catch (e) {
        }
      }

      return {
        id: decoded.Id || decoded.sub,
        email: decoded.email,
        name: decoded.unique_name || decoded.name,
        photoUrl,
      };
    } catch (error) {
      return null;
    }
  }

  login(token: string) {
    this.setToken(token);
    setTimeout(() => this.updateLoginState(true), 100);
  }

  async getBackendUser(userId: string): Promise<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    try {
      return await this.http.get(`${AppConstants.API_LOCAL_BASE_URL}/users/${userId}`, { headers }).toPromise();
    } catch (error) {
      return null;
    }
  }


  updateLoginState(isLoggedIn: boolean) {
    this.loggedInSubject.next(isLoggedIn);
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    this.updateLoginState(false);
  }
}
