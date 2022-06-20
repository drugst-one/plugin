import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleInplaceComponent } from './toggle-inplace.component';

describe('ToggleInplaceComponent', () => {
  let component: ToggleInplaceComponent;
  let fixture: ComponentFixture<ToggleInplaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToggleInplaceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToggleInplaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
