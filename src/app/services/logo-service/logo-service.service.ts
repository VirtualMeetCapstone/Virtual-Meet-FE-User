import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {AppConstants} from "../../constant/AppConstants";

@Injectable({
  providedIn: 'root'
})
export class LogoServiceService {

  private REST_API_SERVER = AppConstants.API_BASE_URL_HTTPS;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  constructor(private http: HttpClient) {}

  getLogo(): Observable<any> {
    const url = `${this.REST_API_SERVER}/admin/logo`;

    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: HttpErrorResponse) {

    console.error('An error occurred:', error);


    return throwError('Something bad happened; please try again later.');
  }
}
