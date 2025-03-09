import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HightlightStoryMyProfileComponent } from './hightlight-story-my-profile.component';

describe('HightlightStoryMyProfileComponent', () => {
  let component: HightlightStoryMyProfileComponent;
  let fixture: ComponentFixture<HightlightStoryMyProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HightlightStoryMyProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HightlightStoryMyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
