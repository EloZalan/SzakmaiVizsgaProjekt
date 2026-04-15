import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { roleGuard } from './role-guard';
import { AuthService, UserRole } from '../services/auth';

class AuthServiceStub {
  loggedIn = false;
  activeRole: UserRole | null = null;
  homeRoute = '/';

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  get role(): UserRole | null {
    return this.activeRole;
  }

  getHomeRouteByRole(): string {
    return this.homeRoute;
  }
}

describe('roleGuard', () => {
  let authStub: AuthServiceStub;
  let routerSpy: Router;
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authStub = new AuthServiceStub();
    navigateByUrlSpy = vi.fn();
    routerSpy = { navigateByUrl: navigateByUrlSpy, url: '/' } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should deny access and redirect to login when user is not logged in', () => {
    authStub.loggedIn = false;

    const result = TestBed.runInInjectionContext(() => roleGuard(['admin'])({} as any, {} as any));

    expect(result).toBe(false);
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/login');
  });

  it('should deny access and redirect to role home when role is not allowed', () => {
    authStub.loggedIn = true;
    authStub.activeRole = 'waiter';
    authStub.homeRoute = '/waiter/user';

    const result = TestBed.runInInjectionContext(() => roleGuard(['admin'])({} as any, {} as any));

    expect(result).toBe(false);
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/waiter/user');
  });

  it('should allow access when user role is included', () => {
    authStub.loggedIn = true;
    authStub.activeRole = 'admin';

    const result = TestBed.runInInjectionContext(() => roleGuard(['admin'])({} as any, {} as any));

    expect(result).toBe(true);
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });
});
