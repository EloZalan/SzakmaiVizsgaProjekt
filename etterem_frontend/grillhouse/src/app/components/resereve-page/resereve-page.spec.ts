import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReserevePage } from './resereve-page';

describe('ReserevePage', () => {
  let component: ReserevePage;
  let fixture: ComponentFixture<ReserevePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReserevePage],
    }).compileComponents();

    fixture = TestBed.createComponent(ReserevePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
