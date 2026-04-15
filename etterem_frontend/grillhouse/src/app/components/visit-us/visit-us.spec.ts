import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitUsComponent } from './visit-us';

describe('VisitUsComponent', () => {
  let component: VisitUsComponent;
  let fixture: ComponentFixture<VisitUsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitUsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitUsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
