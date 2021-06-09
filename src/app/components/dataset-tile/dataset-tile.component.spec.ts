import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {DatasetTileComponent} from './dataset-tile.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

describe('SelectDatasetComponent', () => {
  let component: DatasetTileComponent;
  let fixture: ComponentFixture<DatasetTileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DatasetTileComponent],
      imports: [NgSelectModule, FormsModule, ReactiveFormsModule],
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
