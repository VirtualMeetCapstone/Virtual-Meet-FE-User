import { TestBed } from '@angular/core/testing';

import { ChatOutsideRoomService } from './chat-outside-room.service';

describe('ChatOutsideRoomService', () => {
  let service: ChatOutsideRoomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatOutsideRoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
