import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkUploadDialogComponent } from './network-upload-dialog.component';

describe('NetworkUploadDialogComponent', () => {
  let component: NetworkUploadDialogComponent;
  let fixture: ComponentFixture<NetworkUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkUploadDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
