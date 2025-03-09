import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StoryService } from '../../services/story-service/story-service.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { Viewer } from '../../models/viewer';
import { Reaction } from '../../models/reaction';
import { Story } from '../../models/story';

@Component({
  selector: 'app-story-modal',
  templateUrl: './story-modal.component.html',
  styleUrls: ['./story-modal.component.scss'],
})
export class StoryModalComponent implements OnInit, AfterViewInit {
  viewers: Viewer[] = [];
  userId: string = '';
  stories: any[];
  currentIndex: number;
  currentStory: any;
  isLiked = false;

  constructor(
    public dialogRef: MatDialogRef<StoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storyService: StoryService,
    private authService: AuthService
  ) {
    this.stories = data.stories; //get data from Story Modal
    this.currentIndex = data.currentIndex;
    this.currentStory = this.stories[this.currentIndex];
    this.userId = this.authService.getUser()?.id;
    this.storyService.viewStory(this.userId, this.currentStory.id).subscribe();
    this.loadViewer(this.currentStory);
    this.checkIsLiked();
    this.currentStory.isViewed = true;
    this.stories[this.currentIndex] = this.currentStory;
  }

  ngAfterViewInit(): void {
    this.adjustStoryImageSize();
  }

  checkIsLiked() {
    this.storyService
      .getStoryReaction(this.currentStory.id)
      .subscribe((reactionResponse: any) => {
        //check data response
        //if Reaction[] => Reaction[]
        //if array[] => Reaction[]
        const reactions: Reaction[] = Array.isArray(reactionResponse)
          ? (reactionResponse as Reaction[])
          : Array.isArray(reactionResponse.data)
          ? (reactionResponse.data as Reaction[])
          : [];
        //check is viewed
        this.currentStory.isLiked = reactions.some((reaction: any) => {
          return reaction.userId === this.authService.getUser()?.id;
        });
      });
  }

  next(): void {
    // Đánh dấu story hiện tại là đã xem
    this.currentStory.isViewed = true;

    // Cập nhật currentStory vào danh sách stories
    this.stories[this.currentIndex] = this.currentStory;

    // Gọi API để cập nhật trạng thái xem story trên server
    this.storyService.viewStory(this.userId, this.currentStory.id).subscribe();

    // Chuyển sang story tiếp theo
    this.currentIndex = (this.currentIndex + 1) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
    this.loadViewer(this.currentStory);
    // Cập nhật giao diện và kiểm tra trạng thái
    this.adjustStoryImageSize();
    this.checkIsLiked();

    // Đóng modal nếu đã xem hết danh sách
    if (this.currentIndex === 0) {
      this.close();
    }
  }

  previous(): void {
    // Đánh dấu story hiện tại là đã xem
    this.currentStory.isViewed = true;

    // Cập nhật currentStory vào danh sách stories
    this.stories[this.currentIndex] = this.currentStory;

    // Gọi API để cập nhật trạng thái xem story trên server
    this.storyService.viewStory(this.userId, this.currentStory.id).subscribe();

    // Quay lại story trước đó
    this.currentIndex =
      (this.currentIndex - 1 + this.stories.length) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
    this.loadViewer(this.currentStory);
    // Cập nhật giao diện và kiểm tra trạng thái
    this.adjustStoryImageSize();
    this.checkIsLiked();

    // Đóng modal nếu đã xem hết danh sách
    if (this.currentIndex === this.stories.length - 1) {
      this.close();
    }
  }

  toggleLike(storyId: string): void {
    this.storyService.likeStory(this.userId, storyId).subscribe(
      () => {
        this.checkIsLiked();
      },
      (error: any) => {
        console.error('Error liking story:', error);
      }
    );
  }

  close(): void {
    this.dialogRef.close(this.stories);
  }

  ngOnInit(): void {
    this.loadViewer(this.currentStory);
  }

  checkIsViewed() {
    this.storyService
      .getStoryViewers(this.currentStory)
      .subscribe((viewersResponse: any) => {
        //check data response
        //if viewer[] => viewer[]
        //if array[] => viewer[]
        const viewers: Viewer[] = Array.isArray(viewersResponse)
          ? (viewersResponse as Viewer[])
          : Array.isArray(viewersResponse.data)
          ? (viewersResponse.data as Viewer[])
          : [];
        //check is viewed
        this.currentStory.isViewed = viewers.some((viewerWrapper: any) => {
          return viewerWrapper.viewer.id === this.authService.getUser()?.id;
        });
      });
  }

  loadViewer(story: Story) {
    this.storyService.getStoryViewers(story.id).subscribe((response: any) => {
      if (response && Array.isArray(response.data)) {
        const uniqueViewers = new Map<string, any>();

        response.data.forEach((viewer: any) => {
          if (!uniqueViewers.has(viewer.viewer.id)) {
            uniqueViewers.set(viewer.viewer.id, viewer.viewer);
          }
        });

        this.viewers = Array.from(uniqueViewers.values());
      } else {
        console.error('Unexpected response format:', response);
      }
    });
  }

  adjustStoryImageSize() {
    const storyImage: HTMLImageElement | null =
      document.querySelector('.story-image');
    const preButton: HTMLImageElement | null =
      document.querySelector('.prev-button');
    const nextButton: HTMLImageElement | null =
      document.querySelector('.next-button');
    const userAvatar: HTMLImageElement | null =
      document.querySelector('.story-user-avatar');

    if (storyImage) {
      storyImage.onload = () => {
        const aspectRatio = storyImage.naturalHeight / storyImage.naturalWidth;
        if (aspectRatio > 1.5) {
          // Ảnh chụp bằng điện thoại
          storyImage.style.width = '110%';
          storyImage.style.marginLeft = '-10px';
          if (userAvatar) {
            userAvatar.style.marginLeft = '-40px';
          }
          if (preButton) {
            preButton.style.marginLeft = '-40px';
            preButton.style.right = '107%';
          }
          if (nextButton) {
            nextButton.style.left = '110%';
          }
        } else {
          // Ảnh chụp màn hình máy tính
          storyImage.style.width = '85%';
          storyImage.style.marginLeft = '-5px';
          if (userAvatar) {
            userAvatar.style.marginLeft = '10px';
          }
          if (preButton) {
            preButton.style.right = '94%';
          }
          if (nextButton) {
            nextButton.style.left = '93%';
          }
        }
      };
    }
  }
}
