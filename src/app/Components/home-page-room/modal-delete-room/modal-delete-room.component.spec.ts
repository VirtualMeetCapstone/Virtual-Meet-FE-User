import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeleteRoomComponent } from './modal-delete-room.component';

describe('ModalDeleteRoomComponent', () => {
  let component: ModalDeleteRoomComponent;
  let fixture: ComponentFixture<ModalDeleteRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalDeleteRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDeleteRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
