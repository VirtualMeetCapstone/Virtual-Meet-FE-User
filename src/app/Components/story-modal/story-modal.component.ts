import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StoryServiceService } from '../../services/story-service/story-service.service';
import {AuthService} from "../../services/auth-service/auth.service";
import {Viewer} from "../../models/viewer";

@Component({
  selector: 'app-story-modal',
  templateUrl: './story-modal.component.html',
  styleUrls: ['./story-modal.component.scss'],
})
export class StoryModalComponent implements OnInit {
  viewers: Viewer[] = [];
  userId: string = "";
  stories: any[];
  currentIndex: number;
  currentStory: any;
  isLiked = false;
  constructor(
    public dialogRef: MatDialogRef<StoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storyService: StoryServiceService,
    private authService: AuthService,
  ) {
    this.stories = data.stories; //get data from Story Modal
    this.currentIndex = data.currentIndex;
    this.currentStory = this.stories[this.currentIndex];
  this.userId = this.authService.getUser()?.id
    this.storyService.viewStory(this.userId,this.currentStory.id).subscribe();
this.loadViewer();
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];


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

  toggleLike(storyId: string): void {
    this.storyService.likeStory(this.userId,storyId).subscribe(
        (response: any) => {
        console.log('Liked story successfully:', response);
      },
        (error: any) => {
        console.error('Error liking story:', error);
      }
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
  this.loadViewer();
  }
  loadViewer() {
    this.storyService.getStoryViewers(this.currentStory.id).subscribe((response: any) => {
      if (response && Array.isArray(response.data)) {
        const uniqueViewers = new Map<string, any>();

        response.data.forEach((viewer: any) => {
          if (!uniqueViewers.has(viewer.viewer.id)) {
            uniqueViewers.set(viewer.viewer.id, viewer.viewer);
          }
        });

        this.viewers = Array.from(uniqueViewers.values());
        console.log("Filtered story data:", this.viewers);
      } else {
        console.error("Unexpected response format:", response);
      }
    });
  }


}
