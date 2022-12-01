import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkWarningComponent } from './network-warning.component';

describe('NetworkWarningComponent', () => {
  let component: NetworkWarningComponent;
  let fixture: ComponentFixture<NetworkWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
