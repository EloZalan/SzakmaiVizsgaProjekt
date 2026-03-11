import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { ConfigService } from './config.service';

export type UserRole = 'admin' | 'waiter' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
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

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.config.apiUrl}/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.token = res.token;
          this.user = res.user;

          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        })
      );
  }

  logout() {
    return this.http.post(`${this.config.apiUrl}/logout`, {});
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  get role(): UserRole | null {
    return this.user?.role ?? null;
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

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}