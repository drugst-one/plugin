import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisWindowComponent } from './analysis-window.component';

describe('AnalysisWindowComponent', () => {
  let component: AnalysisWindowComponent;
  let fixture: ComponentFixture<AnalysisWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
