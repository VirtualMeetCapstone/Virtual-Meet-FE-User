import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { isTokenExpired } from '../../../utils/jwt-helper';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(req);
    }

    const isAuthRequest =
      req.url.includes('/login') ||
      req.url.includes('/refresh-token');

    if (isAuthRequest) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    if (!token) {
      // Không có token, gửi request gốc như guest
      return next.handle(req);
    }

    if (!isTokenExpired(token)) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next.handle(authReq);
    }

    // Token hết hạn, lấy refresh token
    const refreshToken = this.authService.getRefreshTokenSafely();

    if (!refreshToken) {
      console.warn('⚠️ Token hết hạn, không có refresh token → logout');
      this.authService.logout();
      // Thay vì gửi request gốc, trả về EMPTY để dừng request vì token đã hết hạn
      return EMPTY;
    }

    // Gọi refresh token
    return this.authService.refreshToken(refreshToken).pipe(
      tap((res) => {
        console.log('🔄 Refresh token thành công:', res);
        this.authService.setToken(res.accessToken, res.refreshToken);
      }),
      switchMap(() => {
        const newReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        });
        return next.handle(newReq);
      }),
      catchError((err) => {
        console.error('❌ Refresh token thất bại:', err);
        this.authService.logout();
        // Trả về EMPTY để dừng request thay vì gửi request gốc không hợp lệ
        return EMPTY;
      })
    );
  }
}
