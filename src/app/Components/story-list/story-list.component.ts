import {StoryModalComponent} from './../story-modal/story-modal.component';
import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {StoryServiceService} from '../../services/story-service/story-service.service';
import {Story} from "../../models/story";
import {AuthService} from "../../services/auth-service/auth.service";
import {Viewer} from "../../models/viewer";
// import { StoryServiceService } from '../../services/story-service/story-service.service';
// import { Story } from '../../models/story';
import {map} from 'rxjs/operators';
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-story-list',
  templateUrl: './story-list.component.html',
  styleUrls: ['./story-list.component.scss'],
})
export class StoryListComponent implements OnInit {
  userId: string = "";
  public storiesData: Story[] = [];
  responsiveOptions = [
    {breakpoint: '1024px', numVisible: 3, numScroll: 3},
    {breakpoint: '768px', numVisible: 2, numScroll: 2},
    {breakpoint: '560px', numVisible: 1, numScroll: 1},
  ];

  constructor(
    public dialog: MatDialog,
    public storyService: StoryServiceService,
    private authService: AuthService,
  ) {
    this.userId = authService.getUser()?.id;
  }

  ngOnInit(): void {
    this.loadStories();

  }

  loadStories() {
    this.storyService.getStories(this.userId).subscribe((response: any) => {
      if (Array.isArray(response)) {
        this.storiesData = response;
      } else if (response && Array.isArray(response.data)) {
        this.storiesData = response.data;
      } else {
        console.error("Unexpected response format:", response);
        return;
      }

      this.storiesData.forEach(story => {

        this.storyService.getStoryViewers(story.id).subscribe((viewersResponse: any) => {

          //check data response
          //if viewer[] => viewer[]
          //if array[] => viewer[]
          const viewers: Viewer[] = Array.isArray(viewersResponse)
            ? viewersResponse as Viewer[]
            : Array.isArray(viewersResponse.data)
              ? viewersResponse.data as Viewer[]
              : []
          //check is viewed
          story.isViewed = viewers.some((viewerWrapper: any) => {
            return viewerWrapper.viewer.id === this.authService.getUser()?.id;
          });
        });
      });
    });
  }

  // open modal, pass data
  openStory(story: Story, index: number): void {
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
