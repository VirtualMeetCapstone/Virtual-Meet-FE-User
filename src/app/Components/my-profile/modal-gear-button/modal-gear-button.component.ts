import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal-gear-button',
  templateUrl: './modal-gear-button.component.html',
  styleUrl: './modal-gear-button.component.scss',
})
export class ModalGearButtonComponent {
  constructor(
    private router: Router,
    public dialogRef: MatDialogRef<ModalGearButtonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  storyStored() {
    if (!this.data.id) {
      console.error('User ID is not provided in the modal data.');
      return;
    }
    this.router.navigate(['/my-profile', this.data.id, 'news-feed-my-profile']);
    this.close();
  }
}
