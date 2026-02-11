import { Injectable, signal, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

const ADMIN_PASSWORD_KEY = 'joya_admin_authenticated';
const ADMIN_PASSWORD_STORAGE = 'joya_admin_password'; // Store password for API calls
const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private readonly api = inject(ApiService);
  
  // Password is validated on the backend only - frontend just stores user input

  readonly isAuthenticated = signal<boolean>(this.checkAuthentication());

  /**
   * Check if user is authenticated (has valid session)
   * Returns the current authentication state
   */
  isAuthenticatedSync(): boolean {
    if (typeof window === 'undefined') return false;
    return this.isAuthenticated();
  }

  /**
   * Check if user is authenticated (has valid session)
   */
  private checkAuthentication(): boolean {
    if (typeof window === 'undefined') return false;
    
    const authData = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!authData) return false;

    try {
      const { timestamp } = JSON.parse(authData);
      const now = Date.now();
      
      // Check if session is still valid (24 hours)
      if (now - timestamp > ADMIN_SESSION_DURATION) {
        localStorage.removeItem(ADMIN_PASSWORD_KEY);
        return false;
      }
      
      return true;
    } catch {
      localStorage.removeItem(ADMIN_PASSWORD_KEY);
      return false;
    }
  }

  /**
   * Authenticate with password by validating it on the backend
   * Returns an Observable<boolean> - true if password is valid
   */
  authenticate(password: string): Observable<boolean> {
    if (typeof window === 'undefined') {
      return of(false);
    }
    
    // Test the password by making a request to a protected endpoint
    // If it succeeds (200), the password is valid
    // If it fails (401), the password is invalid
    return this.api.get<any>('/leads', undefined, {
      Authorization: `Bearer ${password}`,
    }).pipe(
      map((response) => {
        // Only treat 200 OK responses as success
        // Password is valid - store it
        const authData = {
          timestamp: Date.now(),
        };
        localStorage.setItem(ADMIN_PASSWORD_KEY, JSON.stringify(authData));
        localStorage.setItem(ADMIN_PASSWORD_STORAGE, password);
        this.isAuthenticated.set(true);
        return true;
      }),
      catchError((error) => {
        // Check if it's a 401 Unauthorized error
        console.error('Authentication error:', error);
        if (error?.status === 401) {
          // Password is invalid
          return of(false);
        }
        // For other errors, also return false (network errors, etc.)
        return of(false);
      })
    );
  }

  /**
   * Get stored password for API authentication
   */
  getStoredPassword(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_PASSWORD_STORAGE);
  }

  /**
   * Logout
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_PASSWORD_KEY);
    localStorage.removeItem(ADMIN_PASSWORD_STORAGE);
    this.isAuthenticated.set(false);
  }

  /**
   * Get remaining session time in hours
   */
  getRemainingSessionHours(): number {
    if (typeof window === 'undefined') return 0;
    
    const authData = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!authData) return 0;

    try {
      const { timestamp } = JSON.parse(authData);
      const now = Date.now();
      const remaining = ADMIN_SESSION_DURATION - (now - timestamp);
      return Math.max(0, Math.floor(remaining / (60 * 60 * 1000)));
    } catch {
      return 0;
    }
  }
}
