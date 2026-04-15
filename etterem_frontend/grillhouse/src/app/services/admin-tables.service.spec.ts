import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminTablesService } from './admin-tables.service';
import { ConfigService } from './config.service';

describe('AdminTablesService', () => {
  let service: AdminTablesService;
  let httpMock: HttpTestingController;
  let config: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminTablesService);
    httpMock = TestBed.inject(HttpTestingController);
    config = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map table list to view model sorted by id', () => {
    let rows: any[] = [];

    service.getTables().subscribe((data) => (rows = data));

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 3, capacity: 6, status: 'closed' },
      { id: 1, capacity: 4, status: 'free' },
    ]);

    expect(rows.length).toBe(2);
    expect(rows[0].id).toBe(1);
    expect(rows[0].name).toBe('Asztal 1');
    expect(rows[0].status).toBe('ACTIVE');
    expect(rows[1].status).toBe('DISABLED');
  });

  it('should map table overview statuses and reservation note', () => {
    let rows: any[] = [];

    service.getTableOverview().subscribe((data) => (rows = data));

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables`);
    req.flush({
      data: [
        {
          id: 7,
          capacity: 2,
          status: 'ready_to_pay',
          waiter_name: 'Jani',
          reservation: {
            id: 9,
            guest_name: 'Kovács',
            start_time: '18:00',
            end_time: '20:00',
            guest_count: 2,
          },
        },
      ],
    });

    expect(rows[0].status).toBe('Fizetésre vár');
    expect(rows[0].server).toBe('Jani');
    expect(rows[0].note).toContain('Kovács');
  });

  it('should cache admin tables until invalidation', () => {
    service.getTables().subscribe();
    service.getTableOverview().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables`);
    req.flush([]);

    httpMock.expectNone(`${config.apiUrl}/admin/tables`);

    service.invalidateTablesCache();
    service.getTables().subscribe();
    httpMock.expectOne(`${config.apiUrl}/admin/tables`).flush([]);
  });

  it('should create table and return id from direct dto', () => {
    let tableId: number | null = null;

    service.createTable(4).subscribe((id) => (tableId = id));

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ capacity: 4 });
    req.flush({ id: 21, capacity: 4, status: 'free' });

    expect(tableId).toBe(21);
  });

  it('should create table and return id from wrapped dto', () => {
    let tableId: number | null = null;

    service.createTable(6).subscribe((id) => (tableId = id));

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables`);
    req.flush({ data: { id: 22, capacity: 6, status: 'free' } });

    expect(tableId).toBe(22);
  });

  it('should update table endpoint', () => {
    service.updateTable(5, 10).subscribe((res) => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ capacity: 10 });
    req.flush({});
  });

  it('should delete table endpoint', () => {
    service.deleteTable(12).subscribe((res) => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables/12`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should reset table endpoint', () => {
    service.resetTableToFree(13).subscribe((res) => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne(`${config.apiUrl}/admin/tables/13/reset-to-free`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('should map unknown admin status to ACTIVE and reserved to Foglalt in overview', () => {
    service.getTables().subscribe((rows) => {
      expect(rows[0].status).toBe('ACTIVE');
    });

    httpMock.expectOne(`${config.apiUrl}/admin/tables`).flush([
      { id: 1, capacity: 4, status: 'occupied' },
    ]);

    service.invalidateTablesCache();
    service.getTableOverview().subscribe((rows) => {
      expect(rows[0].status).toBe('Foglalt');
    });

    httpMock.expectOne(`${config.apiUrl}/admin/tables`).flush([
      { id: 2, capacity: 4, status: 'reserved', waiter_name: null, reservation: null },
    ]);
  });
});
