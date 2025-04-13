import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reaction-summary',
  templateUrl: './reaction-summary.component.html',
  styleUrls: ['./reaction-summary.component.scss'],
})
export class ReactionSummaryComponent {
  totalCount: number = 0; // Class property to hold the total count

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ReactionSummaryComponent>
  ) {
    if (this.data && this.data.reactionCounts) {
      // Assert reactionCounts as an object with string keys and number values
      const reactionCounts = this.data.reactionCounts as Record<string, number>;
      this.totalCount = Object.values(reactionCounts).reduce(
        (sum: number, count: number) => sum + count,
        0
      );
    }
  }

  getReactionIcon(reactionType: number): string {
    const icons: { [key: number]: string } = {
      0: 'fas fa-thumbs-up', // Like
      1: 'fas fa-heart', // Love
      2: 'fas fa-laugh', // Haha
      3: 'fas fa-surprise', // Wow
      4: 'fas fa-sad-tear', // Sad
      5: 'fas fa-angry', // Angry
    };
    return icons[reactionType] || 'fas fa-thumbs-up'; // Default to Like if undefined
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
