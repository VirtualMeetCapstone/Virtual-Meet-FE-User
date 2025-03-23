import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDetailModalComponent } from './room-detail-modal.component';

describe('RoomDetailModalComponent', () => {
  let component: RoomDetailModalComponent;
  let fixture: ComponentFixture<RoomDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomDetailModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
