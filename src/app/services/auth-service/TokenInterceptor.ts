import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { isTokenExpired } from '../../../utils/jwt-helper';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // ❌ Bỏ qua interceptor với các request liên quan tới auth
    const isAuthRequest =
      req.url.includes('/login') ||
      req.url.includes('/refresh-token');

    if (isAuthRequest) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    // ✅ Nếu không có token → gửi như guest
    if (!token) {
      return next.handle(req);
    }

    // ✅ Nếu token còn hạn → đính kèm Authorization
    if (!isTokenExpired(token)) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next.handle(authReq);
    }

    // 🔄 Token hết hạn → thử refresh
    const refreshToken = this.authService.getRefreshTokenSafely();
    if (!refreshToken) {
      console.warn('⚠️ Token hết hạn, không có refresh token → logout');
      this.authService.logout();
      return next.handle(req);
    }

    // 🚀 Gọi refresh token
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
