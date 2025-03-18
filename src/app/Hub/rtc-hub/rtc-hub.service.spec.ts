import { TestBed } from '@angular/core/testing';

import { RtcHubService } from './rtc-hub.service';

describe('RtcHubService', () => {
  let service: RtcHubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RtcHubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
