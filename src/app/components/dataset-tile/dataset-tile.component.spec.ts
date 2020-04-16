import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetTileComponent } from './dataset-tile.component';

describe('SelectDatasetComponent', () => {
  let component: DatasetTileComponent;
  let fixture: ComponentFixture<DatasetTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatasetTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
