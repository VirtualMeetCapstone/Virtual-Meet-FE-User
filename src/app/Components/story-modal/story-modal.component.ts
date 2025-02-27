import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-story-modal',
  templateUrl: './story-modal.component.html',
  styleUrls: ['./story-modal.component.scss']
})
export class StoryModalComponent {
  stories: any[]; 
  currentIndex: number; 
  currentStory: any; 
  isLiked = false;
  constructor(
    public dialogRef: MatDialogRef<StoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
    this.stories = data.stories; //get data from Story Modal
    this.currentIndex = data.currentIndex; 
    console.log("current index",data.currentIndex)
    this.currentStory = this.stories[this.currentIndex]; 
    console.log("image hien tai: " + this.currentStory)
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
    this.currentIndex = (this.currentIndex - 1 + this.stories.length) % this.stories.length;
    this.currentStory = this.stories[this.currentIndex];
    if (this.currentIndex === this.stories.length-1) {
      this.close();
    }
  }
  

  toggleLike() {
    this.isLiked = !this.isLiked;
  }
  // Đóng modal
  close(): void {
    this.dialogRef.close();
  }
}