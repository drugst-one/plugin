import { TestBed } from '@angular/core/testing';

import { NetexControllerService } from './netex-controller.service';

describe('NetexControllerService', () => {
  let service: NetexControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetexControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
