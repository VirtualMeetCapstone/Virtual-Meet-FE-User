import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryModalMyProfileComponent } from './story-modal-news-feed.component';

describe('StoryModalComponent', () => {
  let component: StoryModalMyProfileComponent;
  let fixture: ComponentFixture<StoryModalMyProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StoryModalMyProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryModalMyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
