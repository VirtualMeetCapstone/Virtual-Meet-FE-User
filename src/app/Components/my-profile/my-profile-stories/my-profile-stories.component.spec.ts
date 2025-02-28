import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProfileStoriesComponent } from './my-profile-stories.component';

describe('MyProfileStoriesComponent', () => {
  let component: MyProfileStoriesComponent;
  let fixture: ComponentFixture<MyProfileStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyProfileStoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyProfileStoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
