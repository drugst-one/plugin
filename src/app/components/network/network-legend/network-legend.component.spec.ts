import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NetworkLegendComponent } from './network-legend.component';

describe('NetworkLegendComponent', () => {
  let component: NetworkLegendComponent;
  let fixture: ComponentFixture<NetworkLegendComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkLegendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
