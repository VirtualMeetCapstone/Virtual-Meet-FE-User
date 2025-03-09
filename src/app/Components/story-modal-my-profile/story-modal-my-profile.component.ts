import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { StoryService } from '../../services/story-service/story-service.service';
import { ModalDeleteStoryComponent } from './modal-delete-story/modal-delete-story.component';

@Component({
  selector: 'app-story-modal-my-profile',
  templateUrl: './story-modal-my-profile.component.html',
  styleUrls: ['./story-modal-my-profile.component.scss'],
})
export class StoryModalMyProfileComponent implements OnInit, OnDestroy {
  @ViewChild('storyVideo') storyVideo!: ElementRef<HTMLVideoElement>;

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
  isMenuOpen = false;
  expirationInterval: any;

  constructor(
    public dialogRef: MatDialogRef<StoryModalMyProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storyService: StoryService,
    private dialog: MatDialog
  ) {
    this.stories = data.stories;
    this.currentIndex = data.currentIndex;
    this.currentStory = this.stories[this.currentIndex];
    this.userAvatar = data.userAvatar;
  }

  ngOnInit(): void {
    this.expirationInterval = setInterval(() => {
      this.checkExpiration();
    }, 1000);
    setTimeout(() => this.tryAutoplayVideo(), 200);
  }

  ngOnDestroy(): void {
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
  }

  checkExpiration(): void {
    const epochTicks = 621355968000000000;
    const ticksPerMillisecond = 10000;
    const expireTimeMs =
      (this.currentStory.expireTime - epochTicks) / ticksPerMillisecond;
    const nowMs = new Date().getTime();
    const timeLeftMs = expireTimeMs - nowMs;
    if (timeLeftMs < 0) {
      this.removeCurrentExpiredStory();
    }
  }

  // Kiểm tra URL có chứa video (dựa vào đuôi file)
  isVideo(url: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|ogg)$/i.test(url);
  }

  // Thử autoplay video: pause, load lại và play
  tryAutoplayVideo(): void {
    if (this.isVideo(this.currentStory?.media?.url)) {
      // Sử dụng ViewChild nếu có
      if (this.storyVideo && this.storyVideo.nativeElement) {
        const videoElem = this.storyVideo.nativeElement;
        videoElem.pause();
        videoElem.load();
        // Đảm bảo video bị muted nếu browser chặn autoplay có âm thanh
        videoElem.play().catch((err) => {
          console.error('Autoplay failed:', err);
        });
      } else {
        // Fallback: query DOM nếu ViewChild chưa có
        setTimeout(() => {
          const videoElement = document.querySelector(
            '.story-video'
          ) as HTMLVideoElement;
          if (videoElement) {
            videoElement.pause();
            videoElement.load();
            videoElement.play().catch((err) => {
              console.error('Autoplay failed:', err);
            });
          }
        }, 200);
      }
    }
  }

  removeCurrentExpiredStory(): void {
    this.stories.splice(this.currentIndex, 1);
    if (this.stories.length === 0) {
      this.close();
    } else {
      if (this.currentIndex >= this.stories.length) {
        this.currentIndex = 0;
      }
      this.currentStory = this.stories[this.currentIndex];
      setTimeout(() => this.tryAutoplayVideo(), 200);
    }
  }

  next(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.stories.length <= 1) {
      this.close();
      return;
    }
    // Nếu đang ở tin cuối cùng, đóng modal thay vì chuyển sang tin đầu tiên
    if (this.currentIndex === this.stories.length - 1) {
      this.close();
      return;
    }
    // Cập nhật tin tiếp theo (không dùng modulo để tránh quay vòng)
    this.currentIndex = this.currentIndex + 1;
    this.currentStory = this.stories[this.currentIndex];
    this.storyService.markAsViewed(this.currentStory.id);
    this.isLiked = false;
    setTimeout(() => this.tryAutoplayVideo(), 200);
  }

  previous(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.stories.length <= 1) {
      this.close();
      return;
    }
    if (this.currentIndex === 0) {
      this.close();
    } else {
      this.currentIndex = this.currentIndex - 1;
      this.currentStory = this.stories[this.currentIndex];
      setTimeout(() => this.tryAutoplayVideo(), 200);
    }
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

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  deleteStory(): void {
    if (this.isVideo(this.currentStory?.media?.url)) {
      if (this.storyVideo && this.storyVideo.nativeElement) {
        this.storyVideo.nativeElement.pause();
      } else {
        const videoElement = document.querySelector(
          '.story-video'
        ) as HTMLVideoElement;
        if (videoElement) {
          videoElement.pause();
        }
      }
    }

    const dialogRef = this.dialog.open(ModalDeleteStoryComponent, {
      width: '300px',
      data: { storyId: this.currentStory.id },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true) {
        this.storyService.deleteStory(this.currentStory.id).subscribe({
          next: (response: any) => {
            this.stories.splice(this.currentIndex, 1);
            if (this.stories.length === 0) {
              this.close();
            } else {
              if (this.currentIndex >= this.stories.length) {
                this.currentIndex = 0;
              }
              this.currentStory = this.stories[this.currentIndex];
              setTimeout(() => this.tryAutoplayVideo(), 200);
            }
            window.location.reload();
          },

          error: (error: any) => {
            console.error('Error deleting story', error);
          },
        });
      } else {
        setTimeout(() => this.tryAutoplayVideo(), 200);
      }
    });
  }
}
