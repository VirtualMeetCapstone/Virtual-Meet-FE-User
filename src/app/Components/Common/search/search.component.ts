import { Component } from '@angular/core';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
  Subject,
} from 'rxjs';
import { SearchService } from '../../../services/search-service/search.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  searchQuery: string = '';
  suggestions: string[] = [];
  showSuggestions: boolean = false;
  private searchSubject = new Subject<string>();

  constructor(private searchService: SearchService) {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.searchService.getSuggestions(query)),
        catchError(() => of([]))
      )
      .subscribe((data) => {
        this.suggestions = data;
        this.showSuggestions = data.length > 0;
      });
  }

  onSearch(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchQuery = input;
    this.searchSubject.next(input); // Đẩy dữ liệu vào Subject
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.suggestions = [];
    this.showSuggestions = false;
  }
}
