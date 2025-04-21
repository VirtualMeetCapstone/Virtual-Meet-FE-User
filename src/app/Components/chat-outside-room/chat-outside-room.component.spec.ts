import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatOutsideRoomComponent } from './chat-outside-room.component';

describe('ChatOutsideRoomComponent', () => {
  let component: ChatOutsideRoomComponent;
  let fixture: ComponentFixture<ChatOutsideRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatOutsideRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatOutsideRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
