import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadButtonInverseComponent } from './download-button-inverse.component';

describe('DownloadButtonInverseComponent', () => {
  let component: DownloadButtonInverseComponent;
  let fixture: ComponentFixture<DownloadButtonInverseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadButtonInverseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadButtonInverseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
