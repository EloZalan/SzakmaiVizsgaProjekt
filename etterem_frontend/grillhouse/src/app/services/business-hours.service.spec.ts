import { TestBed } from '@angular/core/testing';

import { BusinessHoursService } from './business-hours.service';

describe('BusinessHoursService', () => {
  let service: BusinessHoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessHoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return hours for a valid day and null for invalid day', () => {
    expect(service.getHoursForDay(1)?.dayName).toBe('Monday');
    expect(service.getHoursForDay(99)).toBeNull();
  });

  it('should determine open and closed times correctly', () => {
    const openDate = new Date(2026, 3, 20, 12, 30);
    const closeBoundary = new Date(2026, 3, 20, 20, 0);

    expect(service.isOpenAtTime(openDate)).toBe(true);
    expect(service.isOpenAtTime(closeBoundary)).toBe(false);
  });

  it('should provide formatted and raw opening times', () => {
    const date = new Date(2026, 3, 19, 10, 0);

    expect(service.getFormattedHours(date)).toContain('-');
    expect(service.getOpeningTime(date)).toMatch(/^\d{2}:\d{2}$/);
    expect(service.getClosingTime(date)).toMatch(/^\d{2}:\d{2}$/);
    expect(service.getOpeningHour(date)).toBeGreaterThanOrEqual(0);
    expect(service.getClosingHour(date)).toBeGreaterThan(0);
  });

  it('should return all configured hours', () => {
    const rows = service.getAllHours();
    expect(rows.length).toBe(7);
  });
});
