import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-gear-button',
  templateUrl: './modal-gear-button.component.html',
  styleUrl: './modal-gear-button.component.scss',
})
export class ModalGearButtonComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalGearButtonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
