import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { TableInfo, WaiterTableStatus } from '../models/table-info.model';

export interface TableDto {
  id: number;
  capacity: number;
  status: string;
  waiter_name?: string | null;
  reservation?: ReservationDto | null;
}

export interface ReservationDto {
  id: number;
  table_id: number;
  guest_name: string;
  phone_number: string;
  start_time: string;
  end_time: string;
  guest_count: number;
}

export interface OrderDto {
  id: number;
  table_id: number;
  reservation_id: number;
  waiter_id: number;
  total_price: number;
  status: 'in_progress' | 'ready_to_pay' | 'done';
}

export interface TableOrderItemDto {
  id: number;
  menu_item_id: number;
  name: string | null;
  price: number | null;
  quantity: number;
  line_total: number | null;
}

export interface TableOrderDetailsDto {
  order_id?: number;
  table_id?: number;
  reservation_id: number | null;
  status?: 'in_progress' | 'ready_to_pay' | 'done';
  total_price: number;
  opened_at?: string | null;
  items: TableOrderItemDto[];
  message?: string;
}

export interface MenuCategoryDto {
  id: number;
  name: string;
}

export interface MenuItemDto {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class WaiterService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  getTables(): Observable<TableInfo[]> {
    return this.http
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
        })
      );
  }

  getMenuData(): Observable<{ categories: MenuCategoryDto[]; items: MenuItemDto[] }> {
    return forkJoin({
      categories: this.http.get<MenuCategoryDto[]>(`${this.config.apiUrl}/menu-categories`),
      items: this.http.get<MenuItemDto[]>(`${this.config.apiUrl}/menu-items`),
    });
  }

  openOrder(tableId: number): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.config.apiUrl}/tables/${tableId}/orders`, {});
  }

  getTableOrder(tableId: number): Observable<TableOrderDetailsDto> {
    return this.http.get<TableOrderDetailsDto>(`${this.config.apiUrl}/tables/${tableId}/orders`);
  }

  addOrderItem(orderId: number, menuItemId: number, quantity: number): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/items`, {
      menu_item_id: menuItemId,
      quantity,
    });
  }

  markReadyToPay(orderId: number): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/simulate-ready`, {});
  }

  payOrder(orderId: number, paymentMethod: 'cash' | 'card'): Observable<unknown> {
    return this.http.post(`${this.config.apiUrl}/orders/${orderId}/pay`, {
      payment_method: paymentMethod,
    });
  }

  private mapTableDto(table: TableDto, displayIndex: number): TableInfo {
    const guests = table.reservation?.guest_count ?? 0;

    return {
      id: table.id,
      name: `Table ${displayIndex}`,
      status: this.mapTableStatus(table.status),
      guests,
      server: table.waiter_name ?? '-',
      updatedAt: '-',
      items: [],
      note: this.mapReservationNote(table.reservation),
      orderId: null,
    };
  }

  private mapTableStatus(status: string): WaiterTableStatus {
    const normalized = (status ?? '').trim().toLowerCase();

    if (normalized === 'free' || normalized === 'available') {
      return 'FREE';
    }

    if (normalized === 'reserved') {
      return 'RESERVED';
    }

    if (normalized === 'closed' || normalized === 'disabled') {
      return 'CLOSED';
    }

    if (
      normalized === 'needs_payment' ||
      normalized === 'ready_to_pay' ||
      normalized === 'pay'
    ) {
      return 'NEEDS_PAYMENT';
    }

    return 'OCCUPIED';
  }

  private mapReservationNote(reservation?: ReservationDto | null): string | undefined {
    if (!reservation) {
      return undefined;
    }

    return `${reservation.guest_name} · ${reservation.start_time} - ${reservation.end_time}`;
  }
}
