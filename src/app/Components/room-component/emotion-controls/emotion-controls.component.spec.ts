import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmotionControlsComponent } from './emotion-controls.component';

describe('EmotionControlsComponent', () => {
  let component: EmotionControlsComponent;
  let fixture: ComponentFixture<EmotionControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmotionControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmotionControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
