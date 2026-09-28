import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  host: {
    class: 'navbar-wrapper',
  },
})
export class NavbarComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private router = inject(Router);

  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isScrolled = signal(false);
  protected readonly isNavbarHidden = signal(false);
  protected readonly isResourcesOpen = signal(false);
  protected readonly isMobileResourcesOpen = signal(false);
  protected readonly currentUrl = signal('/');
  protected readonly startProjectUrl = `${environment.customerAppUrl.replace(/\/$/, '')}/`;
  protected readonly loginUrl = `${environment.customerAppUrl.replace(/\/$/, '')}/auth/login`;

  private scrollRAF: number | null = null;
  private scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastScrollY = 0;
  private routerSub?: Subscription;
  private readonly scrollThreshold = 10;

  ngOnInit(): void {
    this.currentUrl.set(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.closeMobileMenu();
        this.isResourcesOpen.set(false);
      });

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.document.addEventListener('click', this.handleDocClick);
      this.lastScrollY = window.scrollY;
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.handleScroll);
      this.document.removeEventListener('click', this.handleDocClick);
      if (this.scrollRAF !== null) cancelAnimationFrame(this.scrollRAF);
      if (this.scrollIdleTimer) clearTimeout(this.scrollIdleTimer);
    }
  }

  private handleDocClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.nav__dd')) {
      this.isResourcesOpen.set(false);
    }
  };

  private handleScroll = (): void => {
    if (this.scrollRAF) return;

    this.scrollRAF = requestAnimationFrame(() => {
      if (!isPlatformBrowser(this.platformId)) {
        this.scrollRAF = null;
        return;
      }

      const scrollY = window.scrollY;
      this.isScrolled.set(scrollY > 24);

      const scrollDiff = scrollY - this.lastScrollY;
      const isMobile = window.innerWidth <= 900;

      if (isMobile && !this.isMobileMenuOpen()) {
        if (Math.abs(scrollDiff) > this.scrollThreshold && scrollY > 80) {
          this.isNavbarHidden.set(true);
        }
        if (this.scrollIdleTimer) clearTimeout(this.scrollIdleTimer);
        this.scrollIdleTimer = setTimeout(() => this.isNavbarHidden.set(false), 180);
      } else {
        this.isNavbarHidden.set(false);
      }

      if (scrollY < 80) this.isNavbarHidden.set(false);
      this.lastScrollY = scrollY;
      this.scrollRAF = null;
    });
  };

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
    if (!this.isMobileMenuOpen()) this.isMobileResourcesOpen.set(false);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.isMobileResourcesOpen.set(false);
  }

  protected toggleResources(event: Event): void {
    event.stopPropagation();
    this.isResourcesOpen.update((v) => !v);
  }

  protected toggleMobileResources(): void {
    this.isMobileResourcesOpen.update((v) => !v);
  }

  protected isActive(path: string): boolean {
    const url = this.currentUrl().split('?')[0].split('#')[0];
    return url === path || url.startsWith(`${path}/`);
  }

  protected isResourcesActive(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/ressources') || url.startsWith('/blogs');
  }
}
