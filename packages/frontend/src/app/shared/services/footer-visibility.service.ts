import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Service to control footer visibility across the application.
 * 
 * Usage:
 * - By default, footer is visible on all pages
 * - To hide footer on a specific route, add `hideFooter: true` to route data:
 *   { path: 'some-page', data: { hideFooter: true }, ... }
 * 
 * - Or use the service directly in a component:
 *   constructor(private footerVisibility: FooterVisibilityService) {
 *     this.footerVisibility.setVisible(false);
 *   }
 * 
 * Example in routes:
 * ```typescript
 * {
 *   path: 'special-page',
 *   loadComponent: () => import('./pages/special/special.component').then(m => m.SpecialComponent),
 *   data: { hideFooter: true }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FooterVisibilityService {
  private readonly _isVisible = signal<boolean>(true);
  
  /**
   * Readonly signal indicating whether the footer should be visible
   */
  readonly isVisible = this._isVisible.asReadonly();

  constructor(private router: Router) {
    // Initialize visibility based on current route
    this.updateVisibilityFromRoute();
    
    // Watch for route changes and update visibility based on route data
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateVisibilityFromRoute();
      });
  }

  /**
   * Manually set footer visibility
   * @param visible - Whether the footer should be visible
   */
  setVisible(visible: boolean): void {
    this._isVisible.set(visible);
  }

  /**
   * Update visibility based on current route data
   */
  private updateVisibilityFromRoute(): void {
    const routeData = this.getCurrentRouteData();
    const shouldHide = routeData?.['hideFooter'] === true;
    this._isVisible.set(!shouldHide);
  }

  /**
   * Get the current route's data
   */
  private getCurrentRouteData(): any {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data;
  }
}
