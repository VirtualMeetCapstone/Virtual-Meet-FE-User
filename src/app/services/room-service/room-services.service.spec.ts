import { TestBed } from '@angular/core/testing';

import { RoomServicesService } from '../room-service/room-services.service';

describe('RoomServicesService', () => {
  let service: RoomServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
