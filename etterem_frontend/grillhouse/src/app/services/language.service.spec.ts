import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageService);
  });

  it('should default to hungarian language', () => {
    expect(service.currentLanguageValue).toBe('hu');
  });

  it('should toggle between hu and en', () => {
    service.toggleLanguage();
    expect(service.currentLanguageValue).toBe('en');

    service.toggleLanguage();
    expect(service.currentLanguageValue).toBe('hu');
  });

  it('should set language explicitly', () => {
    service.setLanguage('en');
    expect(service.currentLanguageValue).toBe('en');
  });
});
