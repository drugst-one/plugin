import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaSolidIconComponent } from './fa-solid-icon.component';

describe('FaSolidIconComponent', () => {
  let component: FaSolidIconComponent;
  let fixture: ComponentFixture<FaSolidIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FaSolidIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaSolidIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
