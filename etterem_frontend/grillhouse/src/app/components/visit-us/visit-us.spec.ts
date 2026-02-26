import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitUs } from './visit-us';

describe('VisitUs', () => {
  let component: VisitUs;
  let fixture: ComponentFixture<VisitUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitUs],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitUs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
