import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WaiterService } from './waiter.service';
import { ConfigService } from './config.service';

describe('WaiterService', () => {
  let service: WaiterService;
  let httpMock: HttpTestingController;
  let config: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WaiterService);
    httpMock = TestBed.inject(HttpTestingController);
    config = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map and sort table data from API', () => {
    let result: any[] = [];

    service.getTables().subscribe((tables) => {
      result = tables;
    });

    const req = httpMock.expectOne(`${config.apiUrl}/tables`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 2, capacity: 2, status: 'reserved', waiter_name: 'Péter', reservation: { guest_count: 2, guest_name: 'Kiss', note: 'Ablak', table_id: 2, id: 1, phone_number: '', start_time: '', end_time: '' } },
      { id: 1, capacity: 4, status: 'free', waiter_name: null, reservation: null },
    ]);

    expect(result.length).toBe(2);
    expect(result[0].id).toBe(1);
    expect(result[0].status).toBe('Szabad');
    expect(result[1].status).toBe('Foglalt');
    expect(result[1].reservationName).toBe('Kiss');
  });

  it('should cache table request until invalidated', () => {
    service.getTables().subscribe();
    service.getTables().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/tables`);
    req.flush([]);
    httpMock.expectNone(`${config.apiUrl}/tables`);

    service.invalidateTablesCache();
    service.getTables().subscribe();

    const req2 = httpMock.expectOne(`${config.apiUrl}/tables`);
    req2.flush([]);
  });

  it('should request menu data with two endpoints', () => {
    service.getMenuData().subscribe((res) => {
      expect(res.categories.length).toBe(1);
      expect(res.items.length).toBe(1);
    });

    const categoriesReq = httpMock.expectOne(`${config.apiUrl}/menu-categories`);
    const itemsReq = httpMock.expectOne(`${config.apiUrl}/menu-items`);
    expect(categoriesReq.request.method).toBe('GET');
    expect(itemsReq.request.method).toBe('GET');

    categoriesReq.flush([{ id: 1, name: 'Levesek' }]);
    itemsReq.flush([{ id: 10, name: 'Húsleves', description: null, price: 1590, category_id: 1, image_url: null }]);
  });

  it('should open order and invalidate table cache', () => {
    service.getTables().subscribe();
    httpMock.expectOne(`${config.apiUrl}/tables`).flush([]);

    service.openOrder(4).subscribe();
    const req = httpMock.expectOne(`${config.apiUrl}/tables/4/orders`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 100, table_id: 4, reservation_id: 1, waiter_id: 2, total_price: 0, status: 'in_progress' });

    service.getTables().subscribe();
    httpMock.expectOne(`${config.apiUrl}/tables`).flush([]);
  });

  it('should request table order details endpoint', () => {
    service.getTableOrder(6).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/tables/6/orders`);
    expect(req.request.method).toBe('GET');
    req.flush({ reservation_id: null, total_price: 0, items: [] });
  });

  it('should cache today reservations endpoint', () => {
    service.getTodayReservationsWithOrders().subscribe();
    service.getTodayReservationsWithOrders().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/reservations/today-with-orders`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
    httpMock.expectNone(`${config.apiUrl}/reservations/today-with-orders`);
  });

  it('should add order item with payload', () => {
    service.addOrderItem(12, 7, 3).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/orders/12/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ menu_item_id: 7, quantity: 3 });
    req.flush({ ok: true });
  });

  it('should mark order ready to pay', () => {
    service.markReadyToPay(55).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/orders/55/simulate-ready`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ ok: true });
  });

  it('should pay order with selected method', () => {
    service.payOrder(9, 'card').subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/orders/9/pay`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ payment_method: 'card' });
    req.flush({ ok: true });
  });

  it('should round tip amount in payOrderWithTip', () => {
    service.payOrderWithTip(9, 'cash', 222.6).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/orders/9/pay`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ payment_method: 'cash', tip: 223 });
    req.flush({ ok: true });
  });

  it('should map status branches for payment, disabled and fallback states', () => {
    let result: any[] = [];

    service.getTables().subscribe((tables) => {
      result = tables;
    });

    const req = httpMock.expectOne(`${config.apiUrl}/tables`);
    req.flush([
      { id: 1, capacity: 2, status: 'needs_payment', waiter_name: null, reservation: null },
      { id: 2, capacity: 2, status: 'closed', waiter_name: null, reservation: null },
      { id: 3, capacity: 2, status: 'serving', waiter_name: null, reservation: null },
    ]);

    expect(result[0].status).toBe('Fizetésre vár');
    expect(result[1].status).toBe('Szabad');
    expect(result[2].status).toBe('Asztalnál');
  });

  it('should invalidate all caches and trigger fresh calls', () => {
    service.getTables().subscribe();
    httpMock.expectOne(`${config.apiUrl}/tables`).flush([]);

    service.getMenuData().subscribe();
    httpMock.expectOne(`${config.apiUrl}/menu-categories`).flush([]);
    httpMock.expectOne(`${config.apiUrl}/menu-items`).flush([]);

    service.getTodayReservationsWithOrders().subscribe();
    httpMock.expectOne(`${config.apiUrl}/reservations/today-with-orders`).flush([]);

    service.invalidateAllCaches();

    service.getTables().subscribe();
    httpMock.expectOne(`${config.apiUrl}/tables`).flush([]);

    service.getMenuData().subscribe();
    httpMock.expectOne(`${config.apiUrl}/menu-categories`).flush([]);
    httpMock.expectOne(`${config.apiUrl}/menu-items`).flush([]);

    service.getTodayReservationsWithOrders().subscribe();
    httpMock.expectOne(`${config.apiUrl}/reservations/today-with-orders`).flush([]);
  });
});
