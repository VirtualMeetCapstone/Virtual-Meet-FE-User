import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenSubject: BehaviorSubject<string>;
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  private userSubject: BehaviorSubject<any>;
  private cachedUser: any = null;
  private backendUserCache = new Map<string, any>();
  public user$: any;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };
  private refreshInProgress = false;
  private refreshQueue: ((token: string | null) => void)[] = [];

  constructor(private http: HttpClient) {
    const initialToken = this.getStoredToken();
    this.userSubject = new BehaviorSubject<any>(null);
    this.tokenSubject = new BehaviorSubject<string>(initialToken);
    this.loggedInSubject = new BehaviorSubject<boolean>(!!initialToken);
    this.loggedIn$ = this.loggedInSubject.asObservable();
    this.user$ = this.userSubject.asObservable();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getStoredToken(): string {
    return this.isBrowser() ? localStorage.getItem('accessToken') || '' : '';
  }

  getRefreshTokenSafely(): string | null {
    return this.isBrowser() ? localStorage.getItem('refreshToken') : null;
  }


  getToken(): string {
    return this.tokenSubject.value;
  }
  async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getToken();
    if (accessToken && !this.isTokenExpired(accessToken)) {
      return accessToken;
    }

    const refreshToken = this.getRefreshTokenSafely();
    if (!refreshToken) {
      this.logout();
      return null;
    }

    // Nếu đang làm mới → đợi
    if (this.refreshInProgress) {
      return new Promise(resolve => {
        this.refreshQueue.push(resolve);
      });
    }

    this.refreshInProgress = true;

    try {
      const newTokens = await this.refreshToken(refreshToken).toPromise();
      this.setToken(newTokens!.accessToken, newTokens!.refreshToken);

      // ✅ Thông báo cho tất cả những người đang chờ
      this.refreshQueue.forEach(cb => cb(newTokens!.accessToken));
      this.refreshQueue = [];
      return newTokens!.accessToken;
    } catch (err) {
      console.error('❌ Refresh token không hợp lệ, đăng xuất');
      this.logout();

      this.refreshQueue.forEach(cb => cb(null));
      this.refreshQueue = [];
      return null;
    } finally {
      this.refreshInProgress = false;
    }
  }



  setToken(accessToken: string, refreshToken: string) {
    if (this.isBrowser()) {
      console.log('🚀 Setting token:', refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      this.tokenSubject.next(accessToken);
    }
  }
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() > exp;
    } catch (e) {
      return true;
    }
  }

  refreshToken(refreshToken: string): Observable<{ accessToken: string; refreshToken: string }> {
    return this.http.post<any>(
      `${AppConstants.API_BASE_URL_HTTPS}/refresh-token`,
      { token: refreshToken },
      this.httpOptions
    ).pipe(
      map((res) => {
        if (res?.accessToken && res?.refreshToken) {
          return {
            accessToken: res.accessToken,
            refreshToken: res.refreshToken
          };
        }
        throw new Error('Invalid refresh response');
      }),
      catchError(err => {
        console.error('❌ Lỗi refresh token:', err);
        return throwError(() => new Error('Không thể làm mới access token'));
      })
    );
  }


  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): any {
    if (this.cachedUser) return this.cachedUser;
    const token = this.getToken();
    if (!token) return null;
    return this.getUserFromToken();
  }

  getUserFromToken(): any {
    if (this.cachedUser) return this.cachedUser;

    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      console.log('🔑 Decoded token:', token);
      let photoUrl: string = '';

      // Nếu có `decoded.picture`, sử dụng luôn
      if (typeof decoded.picture === 'string') {
        photoUrl = decoded.picture;
      }

      // Nếu `decoded.Picture` là một object chứa chuỗi JSON
      if (!photoUrl && decoded.Picture?.Url) {
        try {
          const pictureData =
            typeof decoded.Picture.Url === 'string'
              ? JSON.parse(decoded.Picture.Url)
              : decoded.Picture;
          photoUrl = pictureData?.Url || '';
        } catch (e) {
          console.error('Lỗi parse Picture.Url:', e);
        }
      }

      photoUrl = photoUrl || 'assets/images/default-avatar.png';

      this.cachedUser = {
        id: decoded.id || decoded.sub,
        email: decoded.email,
        name: decoded.unique_name || decoded.name || 'Người dùng',
        photoUrl,
      };

      return this.cachedUser;
    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      return null;
    }
  }

  async getBackendUser(userId: string): Promise<any> {
    if (this.backendUserCache.has(userId)) {
      return this.backendUserCache.get(userId);
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    try {
      const user = await this.http
        .get(`${AppConstants.API_BASE_URL_HTTPS}/users/${userId}`, { headers })
        .toPromise();
      this.backendUserCache.set(userId, user);
      return user;
    } catch (error) {
      return null;
    }
  }

  public async fetchUserName(username: string): Promise<string | null> {
    try {
      const user = await this.getBackendUser(username);
      console.log('🔹 User data received:', user);

      if (!user || !user.name) {
        console.error(`❌ User data not found for ${username}`);
        return null;
      }

      return user.name;
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  }

  updateLoginState(isLoggedIn: boolean) {
    this.loggedInSubject.next(isLoggedIn);
  }

  logout() {
    console.log('🚪 Logging out due to expired token');

    const refreshToken = this.getRefreshTokenSafely();

    if (refreshToken) {
      fetch(`${AppConstants.API_BASE_URL_HTTPS}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'text/plain',
        },
        body: JSON.stringify({ token: refreshToken }),
      })
        .then((res) => {
          if (!res.ok) {
            console.warn('⚠️ Backend logout thất bại:', res.status);
          }
        })
        .catch((err) => {
          console.error('❌ Lỗi khi gọi API logout:', err);
        });
    }

    // Xóa toàn bộ localStorage
    if (this.isBrowser()) {
      localStorage.clear(); // Xóa toàn bộ dữ liệu trong localStorage
      this.tokenSubject.next('');
    }

    this.cachedUser = null;
    this.loggedInSubject.next(false);
  }

  getUserByID(userId: string): Observable<string> {
    return this.http
      .get<{ id: string; name: string }>(
        `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}`
      )
      .pipe(map((user) => user.name)); // ✅ Lấy ra `name`
  }
  getFullInformationOfUseById(userId: string): any {
    const finalUrl = `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}`;
    return this.http.get<any>(finalUrl);
  }
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);

    return throwError('Something bad happened; please try again later.');
  }
}
