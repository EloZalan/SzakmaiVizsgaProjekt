import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuPreview } from './menu-preview';

describe('MenuPreview', () => {
  let component: MenuPreview;
  let fixture: ComponentFixture<MenuPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
