import { TestBed } from '@angular/core/testing';

import { VideoHubService } from './video-hub.service';

describe('VideoHubService', () => {
  let service: VideoHubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoHubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
