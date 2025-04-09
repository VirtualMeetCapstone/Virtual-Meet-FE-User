import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ModalDeleteAccountComponent } from '../modal-delete-account/modal-delete-account.component';

@Component({
  selector: 'app-modal-gear-button',
  templateUrl: './modal-gear-button.component.html',
  styleUrls: ['./modal-gear-button.component.scss'], // sửa lại từ styleUrl -> styleUrls
})
export class ModalGearButtonComponent {
  constructor(
    private router: Router,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ModalGearButtonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  storyStored() {
    if (!this.data?.id) {
      console.error('User ID is not provided in the modal data.');
      return;
    }
    this.router.navigate(['/my-profile', this.data.id, 'news-feed-my-profile']);
    this.close();
  }

  deleteAccount() {
    const dialogRef = this.dialog.open(ModalDeleteAccountComponent, {
      width: '400px',
      data: { id: this.data.id },
    });
  }
}
