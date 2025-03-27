import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomControlsComponent } from './room-controls.component';

describe('RoomControlsComponent', () => {
  let component: RoomControlsComponent;
  let fixture: ComponentFixture<RoomControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
