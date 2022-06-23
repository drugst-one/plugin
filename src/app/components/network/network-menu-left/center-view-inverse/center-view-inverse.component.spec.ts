import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CenterViewInverseComponent } from './center-view-inverse.component';

describe('CenterViewInverseComponent', () => {
  let component: CenterViewInverseComponent;
  let fixture: ComponentFixture<CenterViewInverseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CenterViewInverseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CenterViewInverseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
