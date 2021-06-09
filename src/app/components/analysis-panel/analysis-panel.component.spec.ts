import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {AnalysisPanelComponent} from './analysis-panel.component';
import {HttpClientModule} from '@angular/common/http';

describe('AnalysisWindowComponent', () => {
  let component: AnalysisPanelComponent;
  let fixture: ComponentFixture<AnalysisPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisPanelComponent],
      imports: [HttpClientModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
