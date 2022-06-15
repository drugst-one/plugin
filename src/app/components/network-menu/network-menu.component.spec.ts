import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkMenuComponent } from './network-menu.component';

describe('NetworkMenuComponent', () => {
  let component: NetworkMenuComponent;
  let fixture: ComponentFixture<NetworkMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
