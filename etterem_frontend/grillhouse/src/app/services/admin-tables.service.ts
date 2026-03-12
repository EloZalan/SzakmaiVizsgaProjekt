import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfigService } from './config.service';
import { RestaurantTable } from '../models/restaurant-table.model';

interface TableDto {
  id: number;
  capacity: number;
  status: string;
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
      .get<TableDto[] | TableListResponse>(`${this.config.apiUrl}/tables`)
      .pipe(
        map((response) => {
          const rows = Array.isArray(response) ? response : response.data ?? [];

          return rows.map((table) => ({
            id: table.id,
            name: '',
            seats: table.capacity,
            status: table.status,
          }));
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

  private isWrappedSingle(response: TableDto | TableSingleResponse): response is TableSingleResponse {
    return 'data' in response;
  }
}