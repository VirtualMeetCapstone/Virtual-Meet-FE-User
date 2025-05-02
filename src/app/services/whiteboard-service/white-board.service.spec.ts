import { TestBed } from '@angular/core/testing';

import { WhiteBoardService } from './white-board.service';

describe('WhiteBoardService', () => {
  let service: WhiteBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhiteBoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
