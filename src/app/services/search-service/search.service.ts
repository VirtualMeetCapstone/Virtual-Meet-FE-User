import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient) {}

  getSuggestions(query: string): Observable<string[]> {
    const url = `${AppConstants.API_BASE_URL_HTTPS}/searches/suggestions`;
    // Nếu query rỗng, gọi API với trending = true
    if (!query.trim()) {
      return this.http.get<string[]>(`${url}?trending=true`);
    }
    return this.http.get<string[]>(`${url}?query=${encodeURIComponent(query)}`);
  }
}
