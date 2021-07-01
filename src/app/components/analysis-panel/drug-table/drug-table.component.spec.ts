import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugTableComponent } from './drug-table.component';

describe('DrugTableComponent', () => {
  let component: DrugTableComponent;
  let fixture: ComponentFixture<DrugTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrugTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
