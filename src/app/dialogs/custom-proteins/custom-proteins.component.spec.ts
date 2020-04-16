import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {CustomProteinsComponent} from './custom-proteins.component';
import {HttpClientModule} from '@angular/common/http';

describe('CustomProteinsComponent', () => {
  let component: CustomProteinsComponent;
  let fixture: ComponentFixture<CustomProteinsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CustomProteinsComponent],
      imports: [HttpClientModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomProteinsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
