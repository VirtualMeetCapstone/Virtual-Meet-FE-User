import { StoryModalComponent } from './../story-modal/story-modal.component';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StoryServiceService } from '../../services/story-service/story-service.service';
import {Story} from "../../models/story";
// import { StoryServiceService } from '../../services/story-service/story-service.service';
// import { Story } from '../../models/story';

@Component({
  selector: 'app-story-list',
  templateUrl: './story-list.component.html',
  styleUrls: ['./story-list.component.scss'],
})
export class StoryListComponent {
  products = [
    { name: 'Story 1', image: 'bamboo-watch.jpg' },
    { name: 'Story 2', image: 'black-watch.jpg' },
    { name: 'Story 3', image: 'blue-band.jpg' },
    { name: 'Story 4', image: 'blue-t-shirt.jpg' },
    { name: 'Story 5', image: 'bracelet.jpg' },
    { name: 'Story 6', image: 'brown-purse.jpg' },
    { name: 'Story 7', image: 'brown-purse.jpg' },
    { name: 'Story 8', image: 'brown-purse.jpg' },
    { name: 'Story 9', image: 'brown-purse.jpg' },
    { name: 'Story 10', image: 'brown-purse.jpg' },
  ];
  public storiesData: Story[]= [];
  viewedStories: Set<number> = new Set();
  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 },
  ];


  constructor(
    public dialog: MatDialog,
    public storyService: StoryServiceService
  ) {}
  ngOnInit(): void {
    this.loadStories();
  }
  loadStories() {
    this.storyService.getStories('9508ff30-6a84-4c1d-aa86-bc0813cd05fc').subscribe((response: any) => {
      if (Array.isArray(response)) {
        this.storiesData = response;
        console.log("story data"+ this.storiesData);
      } else if (response && Array.isArray(response.data)) {
        this.storiesData = response.data;
        console.log("story data"+ this.storiesData);

      } else {
        console.error("Unexpected response format:", response);
      }
    });
  }

  // open modal, pass data
  openStory(story : Story, index: number): void {
    this.storyService.markAsViewed(index);
    console.log('index ne:' + index);
    const dialogRef = this.dialog.open(StoryModalComponent, {
      width: '500px',
      data: {
        stories: this.storiesData,
        currentIndex: index,
      },
      hasBackdrop: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}
