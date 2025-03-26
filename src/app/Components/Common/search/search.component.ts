import { Component, HostListener } from '@angular/core';
import { Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { SearchService } from '../../../services/search-service/search.service';
import { Router } from '@angular/router';

interface User {
  id: string;
  name: string;
  picture: {
    url: string;
    type: number;
    thumbnailUrl: string | null;
  };
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  searchQuery: string = '';
  trendSuggestions: string[] = [];
  userSuggestions: User[] = [];
  showSuggestions: boolean = false;
  isRecording: boolean = false;
  // Thêm biến lưu profile đã chọn
  selectedUser: User | null = null;

  private searchSubject = new Subject<string>();
  recognition: any;

  constructor(private searchService: SearchService, private router: Router) {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.searchService.getSuggestions(query)),
        catchError(() => of({ trends: [], users: [] }))
      )
      .subscribe((data: { trends: string[]; users: User[] }) => {
        this.trendSuggestions = data.trends;
        this.userSuggestions = data.users;
        // Chỉ hiển thị suggestions nếu có kết quả và chưa có profile được chọn
        this.showSuggestions =
          (data.trends.length > 0 || data.users.length > 0) &&
          !this.selectedUser;
      });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'vi-VN';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.searchQuery = transcript;
          // Khi dùng giọng nói, reset selectedUser nếu có
          this.selectedUser = null;
          this.searchSubject.next(transcript);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        this.recognition.onend = () => {
          this.isRecording = false;
        };
      } else {
        console.warn('Trình duyệt của bạn không hỗ trợ SpeechRecognition.');
      }
    }
  }

  onSearch(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchQuery = input;
    // Reset profile khi người dùng gõ lại
    this.selectedUser = null;
    this.searchSubject.next(input);
  }

  onEnter(): void {
    // Nếu chưa có profile được chọn, thực hiện tìm kiếm
    if (!this.selectedUser) {
      this.searchSubject.next(this.searchQuery);
    }
    this.showSuggestions = true;
  }

  onFocus(): void {
    if (!this.searchQuery.trim()) {
      this.searchSubject.next('');
    } else if (
      this.trendSuggestions.length > 0 ||
      this.userSuggestions.length > 0
    ) {
      this.showSuggestions = true;
    }
  }

  onInputClick(): void {
    if (this.trendSuggestions.length > 0 || this.userSuggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  selectSuggestion(suggestion: string | User): void {
    if (typeof suggestion === 'string') {
      this.searchQuery = suggestion;
      // Nếu chọn suggestion dạng text, không có profile
      this.selectedUser = null;
    } else {
      // Khi chọn profile, cập nhật ô input và lưu lại profile
      this.searchQuery = suggestion.name;
      this.selectedUser = suggestion;
      this.router.navigate(['/my-profile', suggestion.id]);
    }
    this.showSuggestions = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.input-container') &&
      !target.closest('.suggestions')
    ) {
      this.showSuggestions = false;
    }
  }

  toggleVoiceRecognition(): void {
    if (!this.recognition) {
      console.warn('Speech recognition không được hỗ trợ.');
      return;
    }
    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    } else {
      this.recognition.start();
      this.isRecording = true;
    }
  }
}
