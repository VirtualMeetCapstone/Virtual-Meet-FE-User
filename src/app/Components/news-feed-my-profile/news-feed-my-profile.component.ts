import {
  Component,
  Inject,
  Input,
  OnInit,
  Optional,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MyProfileStoryService } from '../../services/my-profile-story/my-profile-story.service';
import { ModalDeleteStoryComponent } from '../story-modal-my-profile/modal-delete-story/modal-delete-story.component';
import { NewsFeedMyProfileService } from '../../services/news-feed-my-profile/news-feed-my-profile.service';
import { decodeJwt, getImageUrlFromToken } from '../../../utils/jwt-helper';
import { StoryModalMyProfileComponent } from '../story-modal-my-profile/story-modal-my-profile.component';

export interface Story {
  id: string;
  media: {
    url: string;
    type: number; // 1: ảnh, 2: video
    thumbnailUrl?: string | null;
  };
  userAvatar: string;
  content: string;
  createTime: Date;
  musicUrl: string; // Lưu trữ nhưng không dùng để hiển thị
}

@Component({
  selector: 'app-story-feed',
  templateUrl: './news-feed-my-profile.component.html',
  styleUrls: ['./news-feed-my-profile.component.scss'],
})
export class NewsFeedMyProfileComponent implements OnInit {
  @Input() user: any;

  isLoading = false;
  stories: Story[] = [];
  activeMenuStoryId: string | null = null;
  userId!: string;
  userAvatar!: string;
  imageUrl!: string;
  isWatched = false;

  constructor(
    private myProfileStoryService: MyProfileStoryService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private newsFeedMyProfileService: NewsFeedMyProfileService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Lấy userAvatar từ dữ liệu được inject hoặc dùng fallback
    this.userAvatar =
      data?.userAvatar ||
      'https://cdn-icons-png.freepik.com/512/7718/7718888.png';
  }

  ngOnInit(): void {
    // Kiểm tra nếu đang chạy trên trình duyệt
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = decodeJwt(token);
          this.userId = decoded.id;
          this.imageUrl = getImageUrlFromToken(token);
        } catch (error) {
          console.error('Lỗi khi giải mã token:', error);
        }
      } else {
        console.error('Không tìm thấy accessToken trong localStorage');
      }
    }
    this.loadStories();
  }

  openStory(): void {
    if (this.stories.length === 0) return;

    // Gọi markAsViewed nếu cần
    this.myProfileStoryService.markAsViewed(this.userId);
    this.isWatched = true;

    // Nếu this.user không tồn tại hoặc không có avatar, dùng this.userAvatar làm fallback
    const userAvatarForDialog =
      this.user && this.user.avatar ? this.user.avatar : this.userAvatar;

    this.dialog.open(StoryModalMyProfileComponent, {
      width: '500px',
      data: {
        stories: this.stories,
        currentIndex: 0,
        userAvatar: userAvatarForDialog,
      },
      hasBackdrop: true,
    });
  }

  loadStories(): void {
    this.isLoading = true;
    this.myProfileStoryService.getMyProfileStories(this.userId).subscribe({
      next: (data: any[]) => {
        this.stories = data.map((apiStory: any) => ({
          id: apiStory.id,
          media: {
            url: apiStory.media.url,
            type: apiStory.media.type,
            thumbnailUrl: apiStory.media.thumbnailUrl,
          },
          userAvatar: apiStory.user?.avatar || this.userAvatar,
          content: apiStory.content,
          createTime: new Date(apiStory.createTime),
          musicUrl: apiStory.musicUrl || '',
        }));
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching stories:', error);
        this.isLoading = false;
      },
    });
  }

  handleImageError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://cdn-icons-png.freepik.com/512/7718/7718888.png';
  }

  toggleMenu(event: MouseEvent, storyId: string): void {
    event.stopPropagation();
    this.activeMenuStoryId =
      this.activeMenuStoryId === storyId ? null : storyId;
  }

  isVideo(story: Story): boolean {
    return story.media.type === 2;
  }

  deleteStory(storyId: string): void {
    const dialogRef = this.dialog.open(ModalDeleteStoryComponent, {
      width: '300px',
      data: { storyId: storyId },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true) {
        this.newsFeedMyProfileService.deleteStory(storyId).subscribe({
          next: () => {
            this.stories = this.stories.filter((story) => story.id !== storyId);
          },
          error: (error: any) => {
            console.error('Error deleting story', error);
          },
        });
      }
      this.activeMenuStoryId = null;
    });
  }
}
