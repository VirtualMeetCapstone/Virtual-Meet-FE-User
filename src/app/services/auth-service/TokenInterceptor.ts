import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { Observable, throwError } from "rxjs";
import { catchError, switchMap, tap } from "rxjs/operators";
import { isTokenExpired} from '../../../utils/jwt-helper';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token && isTokenExpired(token)) {
      this.authService.logout();
      return throwError(() => new Error("Token expired"));
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authReq);
  }


}
