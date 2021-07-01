import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProtTableComponent } from './prot-table.component';

describe('ProtTableComponent', () => {
  let component: ProtTableComponent;
  let fixture: ComponentFixture<ProtTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProtTableComponent ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProtTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
