import { Component, HostListener } from '@angular/core';
import { Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import {
  SearchService,
  Room,
  Post,
} from '../../../services/search-service/search.service';
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

// Type guard to check if an object is a User
function isUser(s: any): s is User {
  return s && s.picture !== undefined;
}

// Updated type guard to check if an object is a Post based on the "content" field
function isPost(s: any): s is Post {
  return s && 'content' in s;
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
  roomSuggestions: Room[] = [];
  postSuggestions: Post[] = [];
  showSuggestions: boolean = false;
  isRecording: boolean = false;

  // Variables to hold the selected objects
  selectedUser: User | null = null;
  selectedRoom: Room | null = null;
  selectedPost: Post | null = null;

  private searchSubject = new Subject<string>();
  recognition: any;

  constructor(private searchService: SearchService, private router: Router) {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.searchService.getSuggestions(query)),
        catchError(() => of({ trends: [], users: [], rooms: [], posts: [] }))
      )
      .subscribe(
        (data: {
          trends: string[];
          users: User[];
          rooms: Room[];
          posts: Post[];
        }) => {
          this.trendSuggestions = data.trends;
          this.userSuggestions = data.users;
          this.roomSuggestions = data.rooms;
          this.postSuggestions = data.posts;
          // Show suggestions if there are results and no object is currently selected
          this.showSuggestions =
            (data.trends.length > 0 ||
              data.users.length > 0 ||
              data.rooms.length > 0 ||
              data.posts.length > 0) &&
            !this.selectedUser &&
            !this.selectedRoom &&
            !this.selectedPost;
        }
      );
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
          // Reset selected objects when using voice
          this.selectedUser = null;
          this.selectedRoom = null;
          this.selectedPost = null;
          this.searchSubject.next(transcript);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        this.recognition.onend = () => {
          this.isRecording = false;
        };
      } else {
        console.warn('Your browser does not support SpeechRecognition.');
      }
    }
  }

  onSearch(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchQuery = input;
    // Reset all selected objects when user types a new search
    this.selectedUser = null;
    this.selectedRoom = null;
    this.selectedPost = null;
    this.searchSubject.next(input);
  }

  onEnter(): void {
    if (!this.selectedUser && !this.selectedRoom && !this.selectedPost) {
      this.searchSubject.next(this.searchQuery);
    }
    this.showSuggestions = true;
  }

  onFocus(): void {
    if (!this.searchQuery.trim()) {
      this.searchSubject.next('');
    } else if (
      this.trendSuggestions.length > 0 ||
      this.userSuggestions.length > 0 ||
      this.roomSuggestions.length > 0 ||
      this.postSuggestions.length > 0
    ) {
      this.showSuggestions = true;
    }
  }

  onInputClick(): void {
    if (
      this.trendSuggestions.length > 0 ||
      this.userSuggestions.length > 0 ||
      this.roomSuggestions.length > 0 ||
      this.postSuggestions.length > 0
    ) {
      this.showSuggestions = true;
    }
  }

  selectSuggestion(suggestion: string | User | Room | Post): void {
    if (typeof suggestion === 'string') {
      this.searchQuery = suggestion;
      // Reset selected objects when a plain text suggestion is chosen
      this.selectedUser = null;
      this.selectedRoom = null;
      this.selectedPost = null;
    } else if (isUser(suggestion)) {
      // It's a User
      this.searchQuery = suggestion.name;
      this.selectedUser = suggestion;
      this.router.navigate(['/my-profile', suggestion.id]);
    } else if (isPost(suggestion)) {
      // It's a Post (using the "content" property for display)
      this.searchQuery = suggestion.content;
      this.selectedPost = suggestion;
      this.router.navigate(['/posts', suggestion.id]);
    } else {
      // Otherwise, it's a Room
      this.searchQuery = suggestion.name;
      this.selectedRoom = suggestion;
      this.router.navigate(['/room', suggestion.id], {
        queryParams: { timestamp: Date.now() },
      });
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
      console.warn('Speech recognition is not supported.');
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
