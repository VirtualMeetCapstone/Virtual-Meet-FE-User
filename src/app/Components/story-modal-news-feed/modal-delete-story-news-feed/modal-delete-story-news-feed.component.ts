import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-delete-story-news-feed',
  templateUrl: './modal-delete-story-news-feed.component.html',
  styleUrl: './modal-delete-story-news-feed.component.scss',
})
export class ModalDeleteStoryNewsFeedComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalDeleteStoryNewsFeedComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
