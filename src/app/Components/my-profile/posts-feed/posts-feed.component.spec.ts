import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostsFeedComponent } from './posts-feed.component';

describe('PostsFeedComponent', () => {
  let component: PostsFeedComponent;
  let fixture: ComponentFixture<PostsFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostsFeedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostsFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
