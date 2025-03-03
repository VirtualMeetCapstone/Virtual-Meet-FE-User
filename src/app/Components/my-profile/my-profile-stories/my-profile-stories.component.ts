import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StoryModalMyProfileComponent } from '../../story-modal-my-profile/story-modal-my-profile.component';
import { MyProfileStoryService } from '../../../services/my-profile-story/my-profile-story.service';

@Component({
  selector: 'app-my-profile-stories',
  templateUrl: './my-profile-stories.component.html',
  styleUrls: ['./my-profile-stories.component.scss'],
})
export class MyProfileStoriesComponent implements OnInit {
  @Input() user: any;
  @Input() userId!: string; // Kiểu string cho UUID

  stories: any[] = [];
  isWatched = false;

  constructor(
    public dialog: MatDialog,
    public myProfileStoryService: MyProfileStoryService
  ) {}

  ngOnInit(): void {
    // console.log('UserId:', this.userId);
    if (this.userId) {
      this.fetchStories();
    }
  }

  fetchStories(): void {
    this.myProfileStoryService.getMyProfileStories(this.userId).subscribe(
      (data: any) => {
        const epochTicks = 621355968000000000;
        const ticksPerMillisecond = 10000;
        const nowMs = new Date().getTime(); // thời gian hiện tại (ms)

        this.stories = (data || [])
          .filter((story: any) => {
            const createTimeMs =
              (story.createTime - epochTicks) / ticksPerMillisecond;

            const timeSinceCreated = nowMs - createTimeMs;

            if (timeSinceCreated < 0) {
              // console.log(timeSinceCreated);
              // console.log(
              //   `LOẠI BỎ tin ID ${story.id} , timeSinceCreated=${timeSinceCreated}ms`
              // );
              return false; // loại bỏ tin
            }

            return true; // tin hợp lệ
          })
          .map((story: any) => ({
            ...story,
            image: story.media?.url,
            name: story.content,
            textContent: story.textContent,
          }));

        // console.log('Stories sau khi lọc:', this.stories);
      },
      (error: any) => {
        console.error('Error fetching stories:', error);
      }
    );
  }

  openStory(): void {
    if (this.stories.length === 0) return;

    this.myProfileStoryService.markAsViewed(this.userId);
    this.isWatched = true;

    this.dialog.open(StoryModalMyProfileComponent, {
      width: '500px',
      data: {
        stories: this.stories,
        currentIndex: 0,
        userAvatar: this.user.avatar,
      },
      hasBackdrop: true,
    });
  }
}
