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

export interface GuestHistoryPoint {
  date: string;
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

  getDailyRevenue(): Observable<number> {
    return this.http
      .get<{ daily_revenue: number }>(`${this.config.apiUrl}/admin/daily-revenue`)
      .pipe(map((res) => res.daily_revenue));
  }

  getGuestCountHistory(): Observable<GuestHistoryPoint[]> {
    return this.http.get<GuestHistoryPoint[]>(`${this.config.apiUrl}/admin/guest-count-history`);
  }

  getTodayGuestCount(): Observable<number> {
    return this.http
      .get<{ today_guests: number }>(`${this.config.apiUrl}/admin/today-guests`)
      .pipe(map((res) => res.today_guests));
  }
}
