import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StoryServiceService } from '../../services/story-service/story-service.service';

@Component({
  selector: 'app-story-modal-my-profile',
  templateUrl: './story-modal-my-profile.component.html',
  styleUrls: ['./story-modal-my-profile.component.scss'],
})
export class StoryModalMyProfileComponent implements OnInit, OnDestroy {
  viewers = [
    { image: 'bamboo-watch.jpg' },
    { image: 'black-watch.jpg' },
    { image: 'blue-band.jpg' },
    { image: 'blue-t-shirt.jpg' },
    { image: 'bracelet.jpg' },
    { image: 'brown-purse.jpg' },
    { image: 'charm.jpg' },
  ];

  stories: any[];
  currentIndex: number;
  currentStory: any;
  userAvatar!: string;
  isLiked = false;

  // Biến lưu ID của interval để dọn dẹp khi đóng modal
  expirationInterval: any;

  constructor(
    public dialogRef: MatDialogRef<StoryModalMyProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storyService: StoryServiceService
  ) {
    this.stories = data.stories;
    this.currentIndex = data.currentIndex;
    this.currentStory = this.stories[this.currentIndex];
    this.userAvatar = data.userAvatar;

    console.log('Modal received stories:', this.stories);
    console.log('Current story:', this.currentStory);
    console.log('Modal received user avatar:', this.userAvatar);
  }

  ngOnInit(): void {
    // Bắt đầu kiểm tra thời gian hết hạn của tin hiện tại mỗi giây
    this.expirationInterval = setInterval(() => {
      this.checkExpiration();
    }, 1000);
  }

  ngOnDestroy(): void {
    // Dọn dẹp interval khi component bị hủy
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
  }

  // Hàm kiểm tra thời gian hết hạn của tin hiện tại
  checkExpiration(): void {
    const epochTicks = 621355968000000000; // Ticks của 1/1/1970
    const ticksPerMillisecond = 10000;
    const expireTimeMs =
      (this.currentStory.expireTime - epochTicks) / ticksPerMillisecond;
    const nowMs = new Date().getTime();
    const timeLeftMs = expireTimeMs - nowMs;

    // Nếu thời gian còn lại < 0, tự động chuyển sang tin tiếp theo
    if (timeLeftMs < 0) {
      console.log(
        'Tin hiện tại đã hết hạn, tự động chuyển sang tin tiếp theo.'
      );
      this.next();
    }
  }

  next(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.currentIndex = (this.currentIndex + 1) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
    // Gọi markAsViewed nếu cần (sử dụng id của story, ví dụ: this.currentStory.id)
    this.storyService.markAsViewed(this.currentStory.id);
    this.isLiked = false;
    // Nếu quay về tin đầu tiên, có thể đóng modal (tùy theo logic)
    if (this.currentIndex === 0) {
      this.close();
    }
  }

  previous(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.currentIndex =
      (this.currentIndex - 1 + this.stories.length) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
  }

  toggleLike(): void {
    this.isLiked = !this.isLiked;
  }

  close(): void {
    this.dialogRef.close();
  }

  extractVideoId(url: string): string {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : '';
  }

  getYouTubeEmbedUrl(url: string): string {
    const videoId = this.extractVideoId(url);
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`;
  }
}
