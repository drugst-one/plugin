import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkMenuLeftComponent } from './network-menu-left.component';

describe('NetworkMenuLeftComponent', () => {
  let component: NetworkMenuLeftComponent;
  let fixture: ComponentFixture<NetworkMenuLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkMenuLeftComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkMenuLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
