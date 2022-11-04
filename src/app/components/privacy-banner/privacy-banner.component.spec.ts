import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyBannerComponent } from './privacy-banner.component';

describe('PrivacyBannerComponent', () => {
  let component: PrivacyBannerComponent;
  let fixture: ComponentFixture<PrivacyBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivacyBannerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
