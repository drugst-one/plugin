import { TestBed } from '@angular/core/testing';

import { OmnipathControllerService } from './omnipath-controller.service';

describe('OmnipathControllerService', () => {
  let service: OmnipathControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OmnipathControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
