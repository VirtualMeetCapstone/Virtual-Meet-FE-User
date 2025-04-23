import { Injectable } from '@angular/core';
import {AppConstants} from "../../constant/AppConstants";
import {HttpClient} from "@angular/common/http";
import {AuthService} from "../auth-service/auth.service";
import {catchError, Observable, throwError} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ReportServiceService {
  private url = `${AppConstants.API_BASE_URL_HTTPS}/posts`;
  private reportUrl = `${AppConstants.API_BASE_URL_HTTPS}/report/report-for-ban`;

  constructor(private http: HttpClient, private authService: AuthService) {}
  sendReport(reportData: {
    targetId: string;
    reporterId: string;
    reportType: number;
    description: string;
  }): Observable<any> {
    return this.http.post(this.reportUrl, reportData).pipe(
      catchError((error) => {
        console.error('Lỗi khi gửi báo cáo:', error);
        // Xử lý lỗi tùy ý, ví dụ: hiện thông báo, gửi lỗi đến server theo dõi, v.v.
        return throwError(() => error);
      })
    );
  }
}
