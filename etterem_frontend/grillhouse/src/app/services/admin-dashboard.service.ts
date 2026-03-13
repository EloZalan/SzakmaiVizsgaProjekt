import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface AdminWaiterDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'waiter' | string;
  on_shift?: boolean;
}

export interface ReservationDto {
  id: number;
  table_id: number;
  guest_name: string;
  phone_number: string;
  start_time: string;
  end_time?: string;
  guest_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  getWaiters(): Observable<AdminWaiterDto[]> {
    return this.http.get<AdminWaiterDto[]>(`${this.config.apiUrl}/admin/waiters`);
  }

  createWaiter(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<AdminWaiterDto | null> {
    return this.http
      .post<AdminWaiterDto | null>(`${this.config.apiUrl}/admin/waiters`, payload)
      .pipe(map((res) => res ?? null));
  }

  deleteWaiter(waiterId: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/waiters/${waiterId}`);
  }

  getReservations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${this.config.apiUrl}/reservations`);
  }

  getTodayGuestCount(now: Date = new Date()): Observable<number> {
    return this.getReservations().pipe(
      map((reservations) =>
        reservations
          .filter((r) => this.isSameLocalDate(new Date(r.start_time), now))
          .reduce((sum, r) => sum + (r.guest_count || 0), 0)
      )
    );
  }

  private isSameLocalDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
