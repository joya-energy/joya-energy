import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  // Check authentication - use sync method for guard
  const isAuth = authService.isAuthenticatedSync();
  
  if (!isAuth) {
    // Redirect to login page
    router.navigate(['/admin-joya-2026/leads/login'], { 
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  return true;
};
