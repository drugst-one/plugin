import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkOverviewComponent } from './network-overview.component';

describe('NetworkOverviewComponent', () => {
  let component: NetworkOverviewComponent;
  let fixture: ComponentFixture<NetworkOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
