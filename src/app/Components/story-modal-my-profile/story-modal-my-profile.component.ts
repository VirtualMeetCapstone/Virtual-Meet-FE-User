import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StoryServiceService } from '../../services/story-service/story-service.service';

@Component({
  selector: 'app-story-modal',
  templateUrl: './story-modal-my-profile.component.html',
  styleUrls: ['./story-modal-my-profile.component.scss'],
})
export class StoryModalMyProfileComponent {
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
  userAvatar!: any;

  isLiked = false;
  constructor(
    public dialogRef: MatDialogRef<StoryModalMyProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storyService: StoryServiceService
  ) {
    this.stories = data.stories; //get data from Story Modal
    this.currentIndex = data.currentIndex;
    this.currentStory = this.stories[this.currentIndex];
    this.userAvatar = data.userAvatar;

    console.log('Current story:', this.currentStory);
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
    this.storyService.markAsViewed(this.currentIndex);
    this.isLiked = !this.isLiked;
    if (this.currentIndex === 0) {
      this.close();
    }
  }

  previous(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.stories.length) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
    if (this.currentIndex === this.stories.length - 1) {
      this.close();
    }
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
  }
  close(): void {
    this.dialogRef.close();
  }
}
