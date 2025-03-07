import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

interface Media {
  url: string;
  type: number;
  thumbnailUrl?: string;
}

interface PostsFeed {
  id: string;
  content: string;
  userId: string;
  user?: {
    name: string;
    picture?: {
      url: string;
      type: number;
      thumbnailUrl?: string;
    };
  };
  medias?: Media[];
  privacy?: number;
  totalReactions?: number;
  reactionCounts?: { [key: string]: number };
  createTime?: number;
  lastModifyTime?: number;
}

@Component({
  selector: 'app-posts-feed',
  templateUrl: './posts-feed.component.html',
  styleUrl: './posts-feed.component.scss',
})
export class PostsFeedComponent implements OnChanges {
  @Input() userId!: string; // Nhận userId từ MyProfileComponent
  postsFeed: PostsFeed[] = [];
  isPostsFeedLoading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && this.userId) {
      this.fetchPostsFeed(this.userId);
    }
  }

  async fetchPostsFeed(id: string) {
    this.isPostsFeedLoading = true;
    try {
      const response = await fetch(
        `${AppConstants.API_BASE_URL_HTTPS}/posts/user/reacted/${id}`
      );
      if (!response.ok) throw new Error('Failed to fetch posts feed');
      const data = await response.json();
      this.postsFeed = data.data;
    } catch (error) {
      console.error('Error fetching posts feed:', error);
    } finally {
      this.isPostsFeedLoading = false;
    }
  }
}
