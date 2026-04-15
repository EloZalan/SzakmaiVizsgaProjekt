import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should default to dark theme', () => {
    expect(service.currentThemeValue).toBe('dark');
  });

  it('should toggle theme', () => {
    service.toggleTheme();
    expect(service.currentThemeValue).toBe('light');

    service.toggleTheme();
    expect(service.currentThemeValue).toBe('dark');
  });

  it('should set theme explicitly', () => {
    service.setTheme('light');
    expect(service.currentThemeValue).toBe('light');
  });
});
