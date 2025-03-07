import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AppConstants } from '../../../constant/AppConstants';

interface Media {
  url: string;
  type: number;
  thumbnailUrl?: string | null;
}

interface UserPicture {
  url?: string;
  type?: number;
  thumbnailUrl?: string | null;
}

interface User {
  name?: string;
  picture?: UserPicture;
}

interface MyPost {
  id?: string;
  content?: string;
  userId?: string;
  user?: User;
  medias?: Media[];
  privacy?: number;
  totalReactions?: number;
  reactionCounts?: { [key: string]: number };
  createTime?: number;
  lastModifyTime?: number;
}

@Component({
  selector: 'app-my-post',
  templateUrl: './my-post.component.html',
  styleUrl: './my-post.component.scss',
})
export class MyPostComponent implements OnChanges {
  @Input() userId!: string; // Nhận userId từ MyProfileComponent
  myPosts: MyPost[] = [];
  isMyPostLoading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && this.userId) {
      this.fetchMyPost(this.userId);
    }
  }

  async fetchMyPost(id: string) {
    this.isMyPostLoading = true;
    try {
      const response = await fetch(
        `${AppConstants.API_BASE_URL_HTTPS}/posts/user/${id}`
      );
      if (!response.ok) throw new Error('Failed to fetch my post');
      const data = await response.json();
      this.myPosts = data.data;
    } catch (error) {
      console.error('Error fetching my post:', error);
    } finally {
      this.isMyPostLoading = false;
    }
  }
}
