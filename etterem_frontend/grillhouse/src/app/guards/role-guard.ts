import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { UserRole } from '../models/user-role.model';

export const roleGuard = (allowed: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigateByUrl('/login');
      return false;
    }

    if (!allowed.includes(auth.role())) {
      router.navigateByUrl(auth.getHomeRouteByRole());
      return false;
    }

    return true;
  };
};