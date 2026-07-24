import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Controls footer and navbar visibility from route data.
 *
 * Route data flags:
 * - `hideFooter: true`
 * - `hideNavbar: true`
 */
@Injectable({
  providedIn: 'root',
})
export class FooterVisibilityService {
  private readonly _isVisible = signal(true);
  private readonly _isNavbarVisible = signal(true);

  readonly isVisible = this._isVisible.asReadonly();
  readonly isNavbarVisible = this._isNavbarVisible.asReadonly();

  constructor(private router: Router) {
    this.updateVisibilityFromRoute();

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateVisibilityFromRoute();
    });
  }

  setVisible(visible: boolean): void {
    this._isVisible.set(visible);
  }

  setNavbarVisible(visible: boolean): void {
    this._isNavbarVisible.set(visible);
  }

  private updateVisibilityFromRoute(): void {
    const routeData = this.getCurrentRouteData();
    this._isVisible.set(routeData?.['hideFooter'] !== true);
    this._isNavbarVisible.set(routeData?.['hideNavbar'] !== true);
  }

  private getCurrentRouteData(): Record<string, unknown> {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data;
  }
}
