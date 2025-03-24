import {
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { SearchService } from '../../../services/search-service/search.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  searchQuery: string = '';
  suggestions: string[] = [];
  showSuggestions: boolean = false;
  isRecording: boolean = false;
  private searchSubject = new Subject<string>();
  recognition: any; // SpeechRecognition instance

  constructor(
    private searchService: SearchService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Thiết lập luồng tìm kiếm với debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.searchService.getSuggestions(query)),
        catchError(() => of([]))
      )
      .subscribe((data: string[]) => {
        this.suggestions = data;
        this.showSuggestions = data.length > 0;
      });
  }

  ngOnInit(): void {
    // Chỉ chạy code SpeechRecognition khi ở trình duyệt
    if (isPlatformBrowser(this.platformId)) {
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
    this.searchSubject.next(input);
  }

  onFocus(): void {
    if (!this.searchQuery.trim()) {
      this.searchSubject.next('');
    } else if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onInputClick(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.suggestions = [];
    this.showSuggestions = false;
  }

  // Ẩn thanh gợi ý khi click ra ngoài
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

  // Toggle nhận diện giọng nói: Nếu đang ghi âm thì dừng, nếu chưa ghi âm thì bắt đầu
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
