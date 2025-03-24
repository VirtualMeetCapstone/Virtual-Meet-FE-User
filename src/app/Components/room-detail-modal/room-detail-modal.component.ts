import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-room-detail-modal',
  templateUrl: './room-detail-modal.component.html',
  styleUrl: './room-detail-modal.component.scss'
})
export class RoomDetailModalComponent {
  constructor(
    public dialogRef: MatDialogRef<RoomDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { room: any }
  ) {}

  closeModal() {
    this.dialogRef.close();
  }
}
