import { TestBed } from '@angular/core/testing';

import { VideoHub } from './video.hub';

describe('VideoHub', () => {
  let service: VideoHub;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoHub);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
