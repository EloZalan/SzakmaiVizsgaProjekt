import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, shareReplay, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { TableInfo, WaiterTableStatus } from '../models/table-info.model';
import type { TableDto } from '../models/waiter-table-dto.model';
import type { ReservationDto } from '../models/waiter-reservation-dto.model';
import type { OrderDto } from '../models/waiter-order-dto.model';
import type { TableOrderItemDto } from '../models/waiter-table-order-item-dto.model';
import type { TableOrderDetailsDto } from '../models/waiter-table-order-details-dto.model';
import type { WaiterDailyReservationOrderItemDto } from '../models/waiter-daily-reservation-order-item-dto.model';
import type { WaiterDailyReservationOrderDto } from '../models/waiter-daily-reservation-order-dto.model';
import type { WaiterDailyReservationDto } from '../models/waiter-daily-reservation-dto.model';
import type { MenuCategoryDto } from '../models/waiter-menu-category-dto.model';
import type { MenuItemDto } from '../models/waiter-menu-item-dto.model';

@Injectable({
  providedIn: 'root',
})
export class WaiterService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private tablesCache$?: Observable<TableInfo[]>;
  private menuDataCache$?: Observable<{ categories: MenuCategoryDto[]; items: MenuItemDto[] }>;
  private todayReservationsCache$?: Observable<WaiterDailyReservationDto[]>;

  getTables(): Observable<TableInfo[]> {
    this.tablesCache$ ??= this.http
      .get(`${this.config.apiUrl}/tables`)
      .pipe(
        tap((response) => console.log('RAW /tables RESPONSE:', response)),
        map((response: unknown) => {
          const rows = Array.isArray(response)
            ? (response as TableDto[])
            : [];

          return rows
            .sort((a, b) => a.id - b.id)
            .map((table, index) => this.mapTableDto(table, index + 1));
        }),
        shareReplay(1)
      );

    return this.tablesCache$;
  }

  getMenuData(): Observable<{ categories: MenuCategoryDto[]; items: MenuItemDto[] }> {
    this.menuDataCache$ ??= forkJoin({
      categories: this.http.get<MenuCategoryDto[]>(`${this.config.apiUrl}/menu-categories`),
      items: this.http.get<MenuItemDto[]>(`${this.config.apiUrl}/menu-items`),
    }).pipe(shareReplay(1));

    return this.menuDataCache$;
  }

  openOrder(tableId: number): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.config.apiUrl}/tables/${tableId}/orders`, {}).pipe(
      tap(() => {
        this.invalidateTablesCache();
        this.invalidateTodayReservationsCache();
      })
    );
  }

  getTableOrder(tableId: number): Observable<TableOrderDetailsDto> {
    return this.http.get<TableOrderDetailsDto>(`${this.config.apiUrl}/tables/${tableId}/orders`);
  }

  getTodayReservationsWithOrders(): Observable<WaiterDailyReservationDto[]> {
    this.todayReservationsCache$ ??= this.http
      .get<WaiterDailyReservationDto[]>(`${this.config.apiUrl}/reservations/today-with-orders`)
      .pipe(shareReplay(1));

    return this.todayReservationsCache$;
  }

  addOrderItem(orderId: number, menuItemId: number, quantity: number): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/items`, {
      menu_item_id: menuItemId,
      quantity,
    }).pipe(
      tap(() => {
        this.invalidateTablesCache();
        this.invalidateTodayReservationsCache();
      })
    );
  }

  markReadyToPay(orderId: number): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/simulate-ready`, {}).pipe(
      tap(() => {
        this.invalidateTablesCache();
        this.invalidateTodayReservationsCache();
      })
    );
  }

  payOrder(orderId: number, paymentMethod: 'cash' | 'card'): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/pay`, {
      payment_method: paymentMethod,
    }).pipe(
      tap(() => {
        this.invalidateTablesCache();
        this.invalidateTodayReservationsCache();
      })
    );
  }

  payOrderWithTip(orderId: number, paymentMethod: 'cash' | 'card', tip: number): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/pay`, {
      payment_method: paymentMethod,
      tip: Math.round(tip || 0),
    }).pipe(
      tap(() => {
        this.invalidateTablesCache();
        this.invalidateTodayReservationsCache();
      })
    );
  }

  invalidateTablesCache(): void {
    this.tablesCache$ = undefined;
  }

  invalidateMenuDataCache(): void {
    this.menuDataCache$ = undefined;
  }

  invalidateTodayReservationsCache(): void {
    this.todayReservationsCache$ = undefined;
  }

  invalidateAllCaches(): void {
    this.invalidateTablesCache();
    this.invalidateMenuDataCache();
    this.invalidateTodayReservationsCache();
  }

  private mapTableDto(table: TableDto, displayIndex: number): TableInfo {
    const guests = table.reservation?.guest_count ?? 0;

    return {
      id: table.id,
      name: `Asztal ${displayIndex}`,
      status: this.mapTableStatus(table.status),
      guests,
      server: table.waiter_name ?? '-',
      reservationName: table.reservation?.guest_name ?? undefined,
      updatedAt: '-',
      items: [],
      note: this.mapReservationNote(table.reservation),
      orderId: null,
    };
  }

  private mapTableStatus(status: string): WaiterTableStatus {
    const normalized = (status ?? '').trim().toLowerCase();

    if (normalized === 'free' || normalized === 'available') {
      return 'Szabad';
    }

    if (normalized === 'reserved') {
      return 'Foglalt';
    }

    if (normalized === 'closed' || normalized === 'disabled') {
      return 'Szabad';
    }

    if (
      normalized === 'needs_payment' ||
      normalized === 'ready_to_pay' ||
      normalized === 'pay'
    ) {
      return 'Fizetésre vár';
    }

    return 'Asztalnál';
  }

  private mapReservationNote(reservation?: ReservationDto | null): string | undefined {
    if (!reservation) {
      return undefined;
    }

    return reservation.note ?? undefined;
  }
}
