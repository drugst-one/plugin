import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryNodeComponent } from './summary-node.component';

describe('SummaryNodeComponent', () => {
  let component: SummaryNodeComponent;
  let fixture: ComponentFixture<SummaryNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
