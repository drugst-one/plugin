import { TestBed } from '@angular/core/testing';

import { NetworkHandlerService } from './network-handler.service';

describe('NetworkHandlerService', () => {
  let service: NetworkHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
