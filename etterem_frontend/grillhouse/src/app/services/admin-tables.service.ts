import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { RestaurantTable } from '../models/restaurant-table.model';
import { WaiterTableStatus } from '../models/table-info.model';

export interface TableDto {
  id: number;
  capacity: number;
  status: string;
  waiter_name?: string | null;
  reservation?: TableReservationDto | null;
  created_at?: string;
  updated_at?: string;
}

interface TableReservationDto {
  id: number;
  guest_name: string;
  start_time: string;
  end_time: string;
  guest_count: number;
}

export interface AdminLiveTable {
  id: number;
  name: string;
  seats: number;
  status: WaiterTableStatus;
  guests: number;
  server: string;
  note?: string;
}

interface TableListResponse {
  data: TableDto[];
}

interface TableSingleResponse {
  data: TableDto;
}

@Injectable({
  providedIn: 'root',
})
export class AdminTablesService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  getTables(): Observable<RestaurantTable[]> {
    return this.http
      .get<TableDto[] | TableListResponse>(`${this.config.apiUrl}/admin/tables`)
      .pipe(
        map((response) => {
          const rows = this.extractRows(response);

          return rows
            .sort((a, b) => a.id - b.id)
            .map((table) => this.mapDtoToViewModel(table));
        })
      );
  }

  getTableOverview(): Observable<AdminLiveTable[]> {
    return this.http
      .get<TableDto[] | TableListResponse>(`${this.config.apiUrl}/admin/tables`)
      .pipe(
        map((response) => {
          const rows = this.extractRows(response);

          return rows
            .sort((a, b) => a.id - b.id)
            .map((table) => this.mapDtoToLiveTable(table));
        })
      );
  }

  createTable(capacity: number): Observable<number | null> {
    return this.http
      .post<TableDto | TableSingleResponse>(`${this.config.apiUrl}/admin/tables`, { capacity })
      .pipe(
        map((response) => {
          const table = this.isWrappedSingle(response) ? response.data : response;
          return table?.id ?? null;
        })
      );
  }

  updateTable(tableId: number, capacity: number): Observable<void> {
    return this.http
      .put(`${this.config.apiUrl}/admin/tables/${tableId}`, { capacity })
      .pipe(map(() => void 0));
  }

  deleteTable(tableId: number): Observable<void> {
    return this.http
      .delete(`${this.config.apiUrl}/admin/tables/${tableId}`)
      .pipe(map(() => void 0));
  }

  private extractRows(response: TableDto[] | TableListResponse): TableDto[] {
    return Array.isArray(response) ? response : response?.data ?? [];
  }

  private mapDtoToViewModel(table: TableDto): RestaurantTable {
    return {
      id: table.id,
      name: `Asztal ${table.id}`,
      seats: table.capacity,
      status: this.mapStatus(table.status),
    };
  }

  private mapDtoToLiveTable(table: TableDto): AdminLiveTable {
    return {
      id: table.id,
      name: `Asztal ${table.id}`,
      seats: table.capacity,
      status: this.mapLiveStatus(table.status),
      guests: table.reservation?.guest_count ?? 0,
      server: table.waiter_name ?? '-',
      note: this.mapReservationNote(table.reservation),
    };
  }

  private mapStatus(status: string): string {
    const normalized = (status ?? '').trim().toLowerCase();

    if (normalized === 'disabled' || normalized === 'closed') {
      return 'DISABLED';
    }

    return 'ACTIVE';
  }

  private mapLiveStatus(status: string): WaiterTableStatus {
    const normalized = (status ?? '').trim().toLowerCase();

    if (normalized === 'free' || normalized === 'available') {
      return 'Szabad';
    }

    if (normalized === 'reserved') {
      return 'RESERVED';
    }

    if (normalized === 'needs_payment' || normalized === 'ready_to_pay' || normalized === 'pay') {
      return 'NEEDS_PAYMENT';
    }

    if (normalized === 'closed' || normalized === 'disabled') {
      return 'CLOSED';
    }

    return 'OCCUPIED';
  }

  private mapReservationNote(reservation?: TableReservationDto | null): string | undefined {
    if (!reservation) {
      return undefined;
    }

    return `${reservation.guest_name} · ${reservation.start_time} - ${reservation.end_time}`;
  }

  private isWrappedSingle(response: TableDto | TableSingleResponse): response is TableSingleResponse {
    return 'data' in response;
  }
}
