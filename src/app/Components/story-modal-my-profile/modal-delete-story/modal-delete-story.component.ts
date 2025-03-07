import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-delete-story',
  templateUrl: './modal-delete-story.component.html',
  styleUrl: './modal-delete-story.component.scss',
})
export class ModalDeleteStoryComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalDeleteStoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
