import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-reaction-summary',
  templateUrl: './reaction-summary.component.html',
  styleUrls: ['./reaction-summary.component.scss'],
})
export class ReactionSummaryComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  getReactionIcon(reactionType: number): string {
    const icons: { [key: number]: string } = {
      0: 'fas fa-thumbs-up',
      1: 'fas fa-laugh',
      2: 'fas fa-surprise',
      3: 'fas fa-sad-tear',
      4: 'fas fa-angry',
    };
    return icons[reactionType] || 'fas fa-thumbs-up';
  }
}
