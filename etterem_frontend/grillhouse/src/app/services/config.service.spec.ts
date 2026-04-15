import { TestBed } from '@angular/core/testing';

import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose backend api url', () => {
    expect(service.apiUrl).toContain('/backend/api');
    expect(service.apiUrl.startsWith('https://')).toBe(true);
  });
});
