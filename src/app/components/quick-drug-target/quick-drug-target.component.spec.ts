import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickDrugTargetComponent } from './quick-drug-target.component';

describe('QuickDrugTargetComponent', () => {
  let component: QuickDrugTargetComponent;
  let fixture: ComponentFixture<QuickDrugTargetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickDrugTargetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickDrugTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
