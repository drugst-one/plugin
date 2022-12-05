import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoTileEdgeComponent } from './info-tile-edge.component';

describe('InfoTileEdgeComponent', () => {
  let component: InfoTileEdgeComponent;
  let fixture: ComponentFixture<InfoTileEdgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoTileEdgeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoTileEdgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
