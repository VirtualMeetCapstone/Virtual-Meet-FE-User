import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomVideoControlComponent } from './room-video-control.component';

describe('RoomVideoControlComponent', () => {
  let component: RoomVideoControlComponent;
  let fixture: ComponentFixture<RoomVideoControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomVideoControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomVideoControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
