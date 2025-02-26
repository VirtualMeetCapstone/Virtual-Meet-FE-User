import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StoryServiceService {

  constructor(private http: HttpClient) { }
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  private readonly BASE_URL = 'http://dev-vmeet.runasp.net/stories/';
  
    
  
    getStories(userId: string): any {
      const url = `${this.BASE_URL}/${userId}/friends`;
      return this.http.get<any>(url, this.httpOptions)
       .pipe(catchError(this.handleError)); 
    }
  
    deleteRoom(id: string): any {
      const deleteUrl = `${this.BASE_URL}/${id}`;
      return this.http.delete<any>(deleteUrl);
    }
    private handleError(error: HttpErrorResponse) {
     
      console.error('An error occurred:', error);
      
      
      return throwError('Something bad happened; please try again later.');
    }
}
