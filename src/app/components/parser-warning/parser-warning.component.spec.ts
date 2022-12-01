import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParserWarningComponent } from './parser-warning.component';

describe('ParserWarningComponent', () => {
  let component: ParserWarningComponent;
  let fixture: ComponentFixture<ParserWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParserWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParserWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
