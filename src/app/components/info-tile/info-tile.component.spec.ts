import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InfoTileComponent } from './info-tile.component';
import {HttpClientModule} from '@angular/common/http';

describe('InfoBoxComponent', () => {
  let component: InfoTileComponent;
  let fixture: ComponentFixture<InfoTileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoTileComponent ],
      imports: [HttpClientModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
