import { TestBed } from '@angular/core/testing';

import { DrugstoneConfigService } from './drugstone-config.service';

describe('DrugstoneConfigService', () => {
  let service: DrugstoneConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrugstoneConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
