import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MyProfileStoryService } from '../../services/my-profile-story/my-profile-story.service';
import { ModalDeleteStoryComponent } from '../story-modal-my-profile/modal-delete-story/modal-delete-story.component';
import { NewsFeedMyProfileService } from '../../services/news-feed-my-profile/news-feed-my-profile.service';

interface Story {
  id: string;
  media: { url: string };
  userAvatar: string;
  content: string;
  createTime: Date;
}

@Component({
  selector: 'app-story-feed',
  templateUrl: './news-feed-my-profile.component.html',
  styleUrls: ['./news-feed-my-profile.component.scss'],
})
export class NewsFeedMyProfileComponent implements OnInit {
  stories: Story[] = [];
  activeMenuStoryId: string | null = null;
  userId: string = 'd3245904-744e-4f67-a55c-1648ceda34c7';
  userAvatar!: string; // Holds the logged-in user's avatar

  constructor(
    private myProfileStoryService: MyProfileStoryService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private newsFeedMyProfileService: NewsFeedMyProfileService,
    private dialog: MatDialog
  ) {
    // Set the component's userAvatar from the injected data
    this.userAvatar =
      data?.userAvatar ||
      'https://cdn-icons-png.freepik.com/512/7718/7718888.png';
  }

  ngOnInit(): void {
    this.loadStories();
  }

  loadStories(): void {
    this.myProfileStoryService.getMyProfileStories(this.userId).subscribe({
      next: (data: any[]) => {
        // Map the API response, using the injected userAvatar as fallback
        this.stories = data.map((apiStory: any) => ({
          id: apiStory.id,
          media: { url: apiStory.media.url },
          userAvatar: apiStory.user?.avatar || this.userAvatar,
          content: apiStory.content,
          createTime: new Date(apiStory.createTime),
        }));
        this.stories.forEach((story, index) => {
          console.log(`Story ${index} userAvatar: ${story.userAvatar}`);
        });
      },
      error: (error: any) => {
        console.error('Error fetching stories: ', error);
      },
    });
  }

  // Fallback image handler if image fails to load
  handleImageError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    img.src = fallback;
  }

  toggleMenu(event: MouseEvent, storyId: string): void {
    event.stopPropagation();
    this.activeMenuStoryId =
      this.activeMenuStoryId === storyId ? null : storyId;
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
