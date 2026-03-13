import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from './config.service';

export type UserRole = 'admin' | 'waiter' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  on_shift?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  user: User | null = this.getStoredUser();
  token: string | null = localStorage.getItem('token');

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.config.apiUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          this.token = res.token;
          this.user = res.user;

          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        })
      );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.config.apiUrl}/user`).pipe(
      tap((user) => this.setUser(user))
    );
  }

  takeShift(): Observable<User> {
    return this.http.post<User>(`${this.config.apiUrl}/take-shift`, {}).pipe(
      tap((user) => this.setUser(user))
    );
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  get role(): UserRole | null {
    return this.user?.role ?? null;
  }

  get isOnShift(): boolean {
    return !!this.user?.on_shift;
  }

  getHomeRouteByRole(): string {
    switch (this.role) {
      case 'admin':
        return '/admin';
      case 'waiter':
        return '/waiter';
      case 'customer':
        return '/';
      default:
        return '/login';
    }
  }

  private setUser(user: User): void {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
