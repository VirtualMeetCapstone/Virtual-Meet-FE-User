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
    console.log('UserId:', this.userId);
    if (this.userId) {
      this.fetchStories();
    }
  }

  fetchStories(): void {
    this.myProfileStoryService.getMyProfileStories(this.userId).subscribe(
      (data: any) => {
        // data đã là mảng story từ response.data
        this.stories = (data || []).map((story: any) => ({
          ...story,
          image: story.media?.url,
          name: story.content,
          textContent: story.textContent,
        }));
        this.isWatched =
          this.stories.length === 0 ||
          this.myProfileStoryService.isViewed(this.userId);
        console.log('Fetched stories:', this.stories);
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

  convertTicksToDate(ticks: number): Date {
    const epochTicks = 621355968000000000;
    const ticksPerMillisecond = 10000;
    const msSinceEpoch = (ticks - epochTicks) / ticksPerMillisecond;
    return new Date(msSinceEpoch);
  }
}
