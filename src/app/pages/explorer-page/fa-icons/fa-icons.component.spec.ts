import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaIconsComponent } from './fa-icons.component';

describe('FaIconsComponent', () => {
  let component: FaIconsComponent;
  let fixture: ComponentFixture<FaIconsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FaIconsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
