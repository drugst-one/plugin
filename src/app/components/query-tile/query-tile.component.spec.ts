import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryTileComponent } from './query-tile.component';

describe('QueryComponent', () => {
  let component: QueryTileComponent;
  let fixture: ComponentFixture<QueryTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueryTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
