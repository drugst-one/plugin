import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalAnalysisButtonComponent } from './external-analysis-button.component';

describe('ExternalAnalysisButtonComponent', () => {
  let component: ExternalAnalysisButtonComponent;
  let fixture: ComponentFixture<ExternalAnalysisButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalAnalysisButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExternalAnalysisButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
