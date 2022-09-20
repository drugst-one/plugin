import { TestBed } from '@angular/core/testing';

import { LegendService } from './legend-service.service';

describe('LegendService', () => {
  let service: LegendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LegendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
