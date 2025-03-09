import { TestBed } from '@angular/core/testing';

import { NewsFeedMyProfileService } from './news-feed-my-profile.service';

describe('NewsFeedMyProfileService', () => {
  let service: NewsFeedMyProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NewsFeedMyProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
