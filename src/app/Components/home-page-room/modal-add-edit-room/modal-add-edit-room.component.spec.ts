import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAddEditRoomComponent } from './modal-add-edit-room.component';

describe('ModalAddEditRoomComponent', () => {
  let component: ModalAddEditRoomComponent;
  let fixture: ComponentFixture<ModalAddEditRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalAddEditRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAddEditRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
