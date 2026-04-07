import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay, tap } from 'rxjs';
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
  private tablesCache$?: Observable<TableDto[]>;

  getTables(): Observable<RestaurantTable[]> {
    return this.getRawTables().pipe(
      map((rows) =>
        rows
          .sort((a, b) => a.id - b.id)
          .map((table, index) => this.mapDtoToViewModel(table, index + 1))
      )
    );
  }

  getTableOverview(): Observable<AdminLiveTable[]> {
    return this.getRawTables().pipe(
      map((rows) =>
        rows
          .sort((a, b) => a.id - b.id)
          .map((table, index) => this.mapDtoToLiveTable(table, index + 1))
      )
    );
  }

  createTable(capacity: number): Observable<number | null> {
    return this.http
      .post<TableDto | TableSingleResponse>(`${this.config.apiUrl}/admin/tables`, { capacity })
      .pipe(
        tap(() => this.invalidateTablesCache()),
        map((response) => {
          const table = this.isWrappedSingle(response) ? response.data : response;
          return table?.id ?? null;
        })
      );
  }

  updateTable(tableId: number, capacity: number): Observable<void> {
    return this.http
      .put(`${this.config.apiUrl}/admin/tables/${tableId}`, { capacity })
      .pipe(
        tap(() => this.invalidateTablesCache()),
        map(() => void 0)
      );
  }

  deleteTable(tableId: number): Observable<void> {
    return this.http
      .delete(`${this.config.apiUrl}/admin/tables/${tableId}`)
      .pipe(
        tap(() => this.invalidateTablesCache()),
        map(() => void 0)
      );
  }

  resetTableToFree(tableId: number): Observable<void> {
    return this.http
      .post(`${this.config.apiUrl}/admin/tables/${tableId}/reset-to-free`, {})
      .pipe(
        tap(() => this.invalidateTablesCache()),
        map(() => void 0)
      );
  }

  invalidateTablesCache(): void {
    this.tablesCache$ = undefined;
  }

  private getRawTables(): Observable<TableDto[]> {
    this.tablesCache$ ??= this.http
      .get<TableDto[] | TableListResponse>(`${this.config.apiUrl}/admin/tables`)
      .pipe(
        map((response) => this.extractRows(response)),
        shareReplay(1)
      );

    return this.tablesCache$;
  }

  private extractRows(response: TableDto[] | TableListResponse): TableDto[] {
    return Array.isArray(response) ? response : response?.data ?? [];
  }

  private mapDtoToViewModel(table: TableDto, displayIndex: number): RestaurantTable {
    return {
      id: table.id,
      name: `Asztal ${displayIndex}`,
      seats: table.capacity,
      status: this.mapStatus(table.status),
    };
  }

  private mapDtoToLiveTable(table: TableDto, displayIndex: number): AdminLiveTable {
    return {
      id: table.id,
      name: `Asztal ${displayIndex}`,
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
      return 'Foglalt';
    }

    if (normalized === 'needs_payment' || normalized === 'ready_to_pay' || normalized === 'pay') {
      return 'Fizetésre vár';
    }

    if (normalized === 'closed' || normalized === 'disabled') {
      return 'Szabad';
    }

    return 'Asztalnál';
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
