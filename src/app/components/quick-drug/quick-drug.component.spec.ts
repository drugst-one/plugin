import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickDrugComponent } from './quick-drug.component';

describe('QuickDrugComponent', () => {
  let component: QuickDrugComponent;
  let fixture: ComponentFixture<QuickDrugComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickDrugComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickDrugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
