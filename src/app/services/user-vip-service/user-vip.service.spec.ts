import { TestBed } from '@angular/core/testing';

import { UserVipService } from './user-vip.service';

describe('UserVipService', () => {
  let service: UserVipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserVipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
