import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsFeedMyProfileComponent } from './news-feed-my-profile.component';

describe('NewsFeedMyProfileComponent', () => {
  let component: NewsFeedMyProfileComponent;
  let fixture: ComponentFixture<NewsFeedMyProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewsFeedMyProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsFeedMyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
