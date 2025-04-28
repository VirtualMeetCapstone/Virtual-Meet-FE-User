import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { isTokenExpired } from '../../../utils/jwt-helper';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(req);
    }

    // Nếu là browser thì mới xử lý token như bình thường
    const isAuthRequest =
      req.url.includes('/login') || req.url.includes('/refresh-token');

    if (isAuthRequest) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    if (!token) {
      return next.handle(req);
    }

    if (!isTokenExpired(token)) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next.handle(authReq);
    }

    const refreshToken = this.authService.getRefreshTokenSafely();
    if (!refreshToken) {
      console.warn('⚠️ Token hết hạn, không có refresh token → logout');
      this.authService.logout();
      return next.handle(req);
    }

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
        return next.handle(req);
      })
    );
  }
}
