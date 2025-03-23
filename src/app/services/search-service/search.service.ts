import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient) {}

  getSuggestions(query: string): Observable<string[]> {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/searches/suggestions`;
    if (!query.trim()) {
      return of([]); // Trả về Observable rỗng nếu query trống
    }
    return this.http.get<string[]>(`${url}?query=${encodeURIComponent(query)}`);
  }
}
