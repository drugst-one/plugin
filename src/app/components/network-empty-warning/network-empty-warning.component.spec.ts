import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkEmptyWarningComponent } from './network-empty-warning.component';

describe('NetworkEmptyWarningComponent', () => {
  let component: NetworkEmptyWarningComponent;
  let fixture: ComponentFixture<NetworkEmptyWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkEmptyWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkEmptyWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
