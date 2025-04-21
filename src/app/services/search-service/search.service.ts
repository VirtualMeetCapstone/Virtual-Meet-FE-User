import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
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

// Updated Room interface based on the response structure
export interface Room {
  id: string;
  ownerId: string;
  createTime: number;
  description: string;
  hashTags: any[];
  lastModifyTime: number;
  maximumMembers: number;
  medias: any[];
  members: any[];
  owner: {
    name: string;
    picture: {
      url: string;
      type: number;
      thumbnailUrl: string | null;
    };
  };
  // If the API returns a field "name" and a field "topic", you can choose which one to display.
  name: string;
  topic: string;
  // Other optional fields if needed
  picture?: any;
  status?: any;
  taggedUserId?: string[];
  totalCount?: number;
}

// Updated Post interface based on the provided response sample
export interface Post {
  id: string;
  content: string;
  commentCount: number;
  createTime: number;
  lastModifyTime: number;
  medias: any[];
  privacy: number;
  reactionCounts: any;
  totalReactions: number;
  user: {
    name: string;
    picture: {
      url: string;
      type: number;
      thumbnailUrl: string | null;
    };
  };
  userId: string;
  totalCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient) {}

  getSuggestions(query: string): Observable<{
    trends: string[];
    users: User[];
    rooms: Room[];
    posts: Post[];
  }> {
    const baseUrl = AppConstants.API_BASE_URL_HTTPS;
    const trendsUrl = `${baseUrl}/searches/suggestions`;
    const usersUrl = `${baseUrl}/users/search`;
    const roomsUrl = `${baseUrl}/rooms`;
    const postsUrl = `${baseUrl}/posts`;

    return forkJoin({
      trends: query.trim()
        ? this.http.get<string[]>(
            `${trendsUrl}?query=${encodeURIComponent(query)}`
          )
        : this.http.get<string[]>(`${trendsUrl}?trending=true`),
      users: this.http
        .get<any>(`${usersUrl}?userName=${encodeURIComponent(query)}`)
        .pipe(map((response) => response.data || response || [])),
      rooms: this.http
        .get<{ data: Room[]; totalCount: number }>(
          `${roomsUrl}?searchText=${encodeURIComponent(query)}`
        )
        .pipe(map((response) => response.data)),
      posts: this.http
        .get<{ data: Post[]; totalCount: number }>(
          `${postsUrl}?searchText=${encodeURIComponent(query)}`
        )
        .pipe(map((response) => response.data)),
    });
  }
  searchUserByName(userName: string): any {
    return this.http.get<any>(
      `${AppConstants.API_BASE_URL_HTTPS}` + '/users/search?userName=' + userName
    );
  }
}
