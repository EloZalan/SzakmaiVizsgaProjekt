import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MenuPreviewComponent } from './menu-preview';

describe('MenuPreviewComponent', () => {
  let component: MenuPreviewComponent;
  let fixture: ComponentFixture<MenuPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPreviewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuPreviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
