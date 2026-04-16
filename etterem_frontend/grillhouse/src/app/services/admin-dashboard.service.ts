import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { ConfigService } from './config.service';
import type { AdminWaiterDto } from '../models/admin-waiter-dto.model';
import type { WaiterInviteDto } from '../models/waiter-invite-dto.model';
import type { ReservationDto } from '../models/admin-reservation-dto.model';
import type { GuestHistoryPoint } from '../models/guest-history-point.model';

export type { AdminWaiterDto } from '../models/admin-waiter-dto.model';
export type { WaiterInviteDto } from '../models/waiter-invite-dto.model';
export type { ReservationDto } from '../models/admin-reservation-dto.model';
export type { GuestHistoryPoint } from '../models/guest-history-point.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private waitersCache$?: Observable<AdminWaiterDto[]>;
  private reservationsCache$?: Observable<ReservationDto[]>;
  private dailyRevenueCache$?: Observable<number>;
  private guestHistoryCache$?: Observable<GuestHistoryPoint[]>;
  private todayGuestCountCache$?: Observable<number>;

  getWaiters(): Observable<AdminWaiterDto[]> {
    this.waitersCache$ ??= this.http
      .get<AdminWaiterDto[]>(`${this.config.apiUrl}/admin/waiters`)
      .pipe(shareReplay(1));

    return this.waitersCache$;
  }

  createWaiter(payload: {
    name: string;
    email: string;
  }): Observable<AdminWaiterDto | null> {
    return this.http
      .post<AdminWaiterDto | null>(`${this.config.apiUrl}/admin/waiters`, payload)
      .pipe(
        tap(() => this.invalidateWaitersCache()),
        map((res) => res ?? null)
      );
  }

  getWaiterInvite(token: string): Observable<WaiterInviteDto> {
    return this.http.get<WaiterInviteDto>(`${this.config.apiUrl}/waiter-invites/${token}`);
  }

  acceptWaiterInvite(payload: {
    token: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.config.apiUrl}/waiter-invites/${payload.token}/accept`,
      {
        password: payload.password,
        password_confirmation: payload.password_confirmation,
      }
    );
  }

  deleteWaiter(waiterId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.config.apiUrl}/admin/waiters/${waiterId}`)
      .pipe(tap(() => this.invalidateWaitersCache()));
  }

  getReservations(): Observable<ReservationDto[]> {
    this.reservationsCache$ ??= this.http
      .get<ReservationDto[]>(`${this.config.apiUrl}/reservations`)
      .pipe(shareReplay(1));

    return this.reservationsCache$;
  }

  getDailyRevenue(): Observable<number> {
    this.dailyRevenueCache$ ??= this.http
      .get<{ daily_revenue: number }>(`${this.config.apiUrl}/admin/daily-revenue`)
      .pipe(
        map((res) => res.daily_revenue),
        shareReplay(1)
      );

    return this.dailyRevenueCache$;
  }

  getGuestCountHistory(): Observable<GuestHistoryPoint[]> {
    this.guestHistoryCache$ ??= this.http
      .get<GuestHistoryPoint[]>(`${this.config.apiUrl}/admin/guest-count-history`)
      .pipe(shareReplay(1));

    return this.guestHistoryCache$;
  }

  getTodayGuestCount(): Observable<number> {
    this.todayGuestCountCache$ ??= this.http
      .get<{ today_guests: number }>(`${this.config.apiUrl}/admin/today-guests`)
      .pipe(
        map((res) => res.today_guests),
        shareReplay(1)
      );

    return this.todayGuestCountCache$;
  }

  invalidateWaitersCache(): void {
    this.waitersCache$ = undefined;
  }

  invalidateStatsCache(): void {
    this.dailyRevenueCache$ = undefined;
    this.guestHistoryCache$ = undefined;
    this.todayGuestCountCache$ = undefined;
    this.reservationsCache$ = undefined;
  }

  invalidateAllCaches(): void {
    this.invalidateWaitersCache();
    this.invalidateStatsCache();
  }
}
