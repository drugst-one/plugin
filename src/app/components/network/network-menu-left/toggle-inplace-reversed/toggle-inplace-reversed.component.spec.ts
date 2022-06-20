import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleInplaceReversedComponent } from './toggle-inplace-reversed.component';

describe('ToggleInplaceReversedComponent', () => {
  let component: ToggleInplaceReversedComponent;
  let fixture: ComponentFixture<ToggleInplaceReversedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToggleInplaceReversedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToggleInplaceReversedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
