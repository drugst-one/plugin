import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupWarningComponent } from './group-warning.component';

describe('GroupWarningComponent', () => {
  let component: GroupWarningComponent;
  let fixture: ComponentFixture<GroupWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
