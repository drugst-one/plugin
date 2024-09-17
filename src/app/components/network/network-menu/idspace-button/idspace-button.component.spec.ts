import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdspaceButtonComponent } from './idspace-button.component';

describe('IdspaceButtonComponent', () => {
  let component: IdspaceButtonComponent;
  let fixture: ComponentFixture<IdspaceButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdspaceButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdspaceButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
