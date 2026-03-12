import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { TableInfo, WaiterTableStatus } from '../models/table-info.model';

export interface TableDto {
  id: number;
  capacity: number;
  status: string;
}

interface TableListResponse {
  data: TableDto[];
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
  order_id: number;
  table_id: number;
  reservation_id: number | null;
  status: 'in_progress' | 'ready_to_pay' | 'done';
  total_price: number;
  items: TableOrderItemDto[];
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
      map((response: any) => {
        const rows = Array.isArray(response) ? response : response?.data ?? [];

        return rows
          .sort((a: any, b: any) => a.id - b.id)
          .map((table: any, index: number) => this.mapTableDto(table, index + 1));
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
    return {
      id: table.id,
      name: `Table ${displayIndex}`,
      status: this.mapTableStatus(table.status),
      guests: 0,
      server: '-',
      updatedAt: '-',
      items: [],
      note: undefined,
      orderId: null,
    };
  }

  private mapTableStatus(status: string): WaiterTableStatus {
    const normalized = (status ?? '').trim().toLowerCase();

    if (normalized === 'free' || normalized === 'available') {
      return 'FREE';
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
}
