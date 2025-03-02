import { TestBed } from '@angular/core/testing';

import { MyProfileStoryService } from './my-profile-story.service';

describe('MyProfileStoryService', () => {
  let service: MyProfileStoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyProfileStoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
