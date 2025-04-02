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

  getToken(): string {
    return this.tokenSubject.value;
  }

  setToken(accessToken: string, refreshToken: string) {
    if (this.isBrowser()) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      this.tokenSubject.next(accessToken);
    }
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

  login(token: string, refreshToken: string) {
    this.setToken(token, refreshToken);
    this.updateLoginState(true);
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
    if (this.isBrowser()) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.tokenSubject.next('');
    }

    this.cachedUser = null;
    this.loggedInSubject.next(false);
    document.cookie =
      'g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
