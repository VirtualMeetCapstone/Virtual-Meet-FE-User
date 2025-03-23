import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeleteStoryNewsFeedComponent } from './modal-delete-story-news-feed.component';

describe('ModalDeleteStoryComponent', () => {
  let component: ModalDeleteStoryNewsFeedComponent;
  let fixture: ComponentFixture<ModalDeleteStoryNewsFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalDeleteStoryNewsFeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalDeleteStoryNewsFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
