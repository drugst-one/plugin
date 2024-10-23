import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneRowsComponent } from './gene-rows.component';

describe('GeneRowsComponent', () => {
  let component: GeneRowsComponent;
  let fixture: ComponentFixture<GeneRowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneRowsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
