import { Injectable, signal } from '@angular/core';

export type UserRole = 'guest' | 'pincer' | 'admin';

export interface AuthUser {
  username: string;
  role: UserRole;
}

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
    // TODO: később ide jön API hívás
    // MOST: demo - "pincer" user -> pincer role, különben guest
    const role: UserRole = username.toLowerCase() === 'pincer' ? 'pincer' : 'guest';
    this._user.set({ username, role });
  }

  logout(): void {
    this._user.set(null);
  }

  getHomeRouteByRole(): string {
    const r = this.role();
    if (r === 'pincer') return '/waiter';
    if (r === 'admin') return '/admin'; // ha később lesz
    return '/';
  }
}