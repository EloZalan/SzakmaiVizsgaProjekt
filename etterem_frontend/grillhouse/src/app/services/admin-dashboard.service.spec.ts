import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminDashboardService } from './admin-dashboard.service';
import { ConfigService } from './config.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpMock: HttpTestingController;
  let config: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
    config = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should cache waiter list requests', () => {
    service.getWaiters().subscribe();
    service.getWaiters().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/waiters`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'A', email: 'a@a.com', role: 'waiter' }]);

    httpMock.expectNone(`${config.apiUrl}/admin/waiters`);
  });

  it('should create waiter and invalidate waiter cache', () => {
    service.getWaiters().subscribe();
    httpMock.expectOne(`${config.apiUrl}/admin/waiters`).flush([]);

    service.createWaiter({ name: 'Béla', email: 'bela@x.hu' }).subscribe((res) => {
      expect(res?.name).toBe('Béla');
    });

    const createReq = httpMock.expectOne(`${config.apiUrl}/admin/waiters`);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual({ name: 'Béla', email: 'bela@x.hu' });
    createReq.flush({ id: 2, name: 'Béla', email: 'bela@x.hu', role: 'waiter' });

    service.getWaiters().subscribe();
    httpMock.expectOne(`${config.apiUrl}/admin/waiters`).flush([]);
  });

  it('should get waiter invite by token', () => {
    service.getWaiterInvite('token-1').subscribe((res) => {
      expect(res.email).toBe('waiter@x.hu');
    });

    const req = httpMock.expectOne(`${config.apiUrl}/waiter-invites/token-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ name: 'Waiter', email: 'waiter@x.hu', expires_at: '2026-04-20' });
  });

  it('should accept waiter invite with password payload', () => {
    service.acceptWaiterInvite({ token: 'abc', password: 'Secret123', password_confirmation: 'Secret123' }).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/waiter-invites/abc/accept`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'Secret123', password_confirmation: 'Secret123' });
    req.flush({ message: 'ok' });
  });

  it('should delete waiter and invalidate cache', () => {
    service.deleteWaiter(4).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/waiters/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should map daily revenue and cache response', () => {
    let revenue = -1;

    service.getDailyRevenue().subscribe((value) => (revenue = value));
    service.getDailyRevenue().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/daily-revenue`);
    req.flush({ daily_revenue: 123456 });

    expect(revenue).toBe(123456);
    httpMock.expectNone(`${config.apiUrl}/admin/daily-revenue`);
  });

  it('should return guest history points endpoint', () => {
    service.getGuestCountHistory().subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].guest_count).toBe(40);
    });

    const req = httpMock.expectOne(`${config.apiUrl}/admin/guest-count-history`);
    expect(req.request.method).toBe('GET');
    req.flush([{ date: '2026-04-15', guest_count: 40 }]);
  });

  it('should map today guest count response', () => {
    service.getTodayGuestCount().subscribe((count) => {
      expect(count).toBe(77);
    });

    const req = httpMock.expectOne(`${config.apiUrl}/admin/today-guests`);
    expect(req.request.method).toBe('GET');
    req.flush({ today_guests: 77 });
  });

  it('should invalidate stats cache and refetch daily revenue', () => {
    service.getDailyRevenue().subscribe();
    httpMock.expectOne(`${config.apiUrl}/admin/daily-revenue`).flush({ daily_revenue: 10 });

    service.invalidateStatsCache();
    service.getDailyRevenue().subscribe((value) => {
      expect(value).toBe(20);
    });
    httpMock.expectOne(`${config.apiUrl}/admin/daily-revenue`).flush({ daily_revenue: 20 });
  });

  it('should invalidate all caches and refetch waiters', () => {
    service.getWaiters().subscribe();
    httpMock.expectOne(`${config.apiUrl}/admin/waiters`).flush([]);

    service.invalidateAllCaches();
    service.getWaiters().subscribe();
    httpMock.expectOne(`${config.apiUrl}/admin/waiters`).flush([]);
  });
});
