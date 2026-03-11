import { Injectable, signal } from '@angular/core';
import { AuthUser } from '../models/auth-user.model';
import { UserRole } from '../models/user-role.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(null);

  user = this._user.asReadonly();

  isLoggedIn(): boolean {
    return this._user() !== null;
  }

  role(): UserRole {
    return this._user()?.role ?? 'guest';
  }

  login(username: string, password: string): void {
    let role: UserRole = 'guest';

    if (username.trim().toLowerCase() === 'pincer') {
      role = 'pincer';
    } else if (username.trim().toLowerCase() === 'admin') {
      role = 'admin';
    }

    this._user.set({ username, role });
  }

  logout(): void {
    this._user.set(null);
  }

  getHomeRouteByRole(): string {
    const role = this.role();

    if (role === 'pincer') return '/waiter';
    if (role === 'admin') return '/admin';

    return '/';
  }
}