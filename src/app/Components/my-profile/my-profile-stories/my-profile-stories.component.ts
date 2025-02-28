import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StoryServiceService } from '../../../services/story-service/story-service.service';
import { StoryModalComponent } from '../../story-modal/story-modal.component';

@Component({
  selector: 'app-my-profile-stories',
  templateUrl: './my-profile-stories.component.html',
  styleUrl: './my-profile-stories.component.scss',
})
export class MyProfileStoriesComponent {
  @Input() user: any;
  @Input() userId!: number;

  constructor(
    public dialog: MatDialog,
    public storyService: StoryServiceService
  ) {}

  openStory(): void {
    this.storyService.markAsViewed(this.userId);
    this.dialog.open(StoryModalComponent, {
      width: '500px',
      data: {
        stories: [{ name: this.user.name, image: this.user.avatar }],
        currentIndex: 0,
      },
      hasBackdrop: true,
    });
  }
}
