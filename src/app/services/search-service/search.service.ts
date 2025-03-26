import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

interface User {
  id: string;
  name: string;
  picture: {
    url: string;
    type: number;
    thumbnailUrl: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient) {}

  getSuggestions(
    query: string
  ): Observable<{ trends: string[]; users: User[] }> {
    const baseUrl = AppConstants.API_BASE_URL_HTTPS;
    const trendsUrl = `${baseUrl}/searches/suggestions`;
    const usersUrl = `${baseUrl}/users/search`;

    return forkJoin({
      // Nếu query không rỗng thì tìm theo query, nếu rỗng thì gọi trending (hoặc backend có thể trả về gợi ý user mặc định)
      trends: query.trim()
        ? this.http.get<string[]>(
            `${trendsUrl}?query=${encodeURIComponent(query)}`
          )
        : this.http.get<string[]>(`${trendsUrl}?trending=true`),
      users: this.http
        .get<any>(`${usersUrl}?userName=${encodeURIComponent(query)}`)
        .pipe(map((response) => response.data || response || [])),
    });
  }
}
