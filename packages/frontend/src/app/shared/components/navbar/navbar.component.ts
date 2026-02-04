import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface NavLink {
  label: string;
  path: string;
  id: string;
}

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
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isScrolled = signal(false);
  protected readonly isNavbarHidden = signal(false); // New: for hide on scroll down
  protected readonly isDesktop = signal(true);

  private scrollRAF: number | null = null;
  private resizeRAF: number | null = null;
  private lastScrollY = 0;
  private readonly scrollThreshold = 10; // Minimum scroll distance to trigger hide/show

  // Computed property to check if we should apply scrolled class (desktop only)
  protected readonly shouldShowScrolled = computed(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return this.isScrolled();
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.handleResize(); // Set initial desktop state
      window.addEventListener('resize', this.handleResize, { passive: true });
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.lastScrollY = window.scrollY;
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('scroll', this.handleScroll);

      if (this.scrollRAF !== null) {
        cancelAnimationFrame(this.scrollRAF);
      }
      if (this.resizeRAF !== null) {
        cancelAnimationFrame(this.resizeRAF);
      }
    }
  }

  private handleResize = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.resizeRAF) {
      cancelAnimationFrame(this.resizeRAF);
    }

    this.resizeRAF = requestAnimationFrame(() => {
      this.isDesktop.set(window.innerWidth >= 1024);
      this.resizeRAF = null;
    });
  };

  private handleScroll = (): void => {
    if (this.scrollRAF) return;

    this.scrollRAF = requestAnimationFrame(() => {
      if (isPlatformBrowser(this.platformId)) {
        const scrollY = window.scrollY;

        // Desktop: just track if scrolled for background change
        this.isScrolled.set(scrollY > 50);

        // Mobile: hide on scroll down, show on scroll up
        if (!this.isDesktop()) {
          const scrollDiff = scrollY - this.lastScrollY;

          // Only trigger if scrolled past threshold
          if (Math.abs(scrollDiff) > this.scrollThreshold) {
            if (scrollDiff > 0 && scrollY > 100) {
              // Scrolling down & past 100px - hide navbar
              this.isNavbarHidden.set(true);
            } else if (scrollDiff < 0) {
              // Scrolling up - show navbar
              this.isNavbarHidden.set(false);
            }
          }

          // Always show navbar at top of page
          if (scrollY < 100) {
            this.isNavbarHidden.set(false);
          }
        } else {
          // Desktop: always show navbar
          this.isNavbarHidden.set(false);
        }

        this.lastScrollY = scrollY;
      }
      this.scrollRAF = null;
    });
  };

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected readonly navLinks: NavLink[] = [
    { label: 'Notre solution', path: '/notre-solution', id: 'nav-solution' },
    { label: 'Notre approche', path: '#', id: 'nav-approche' },
    { label: 'Plateforme digitale', path: '/plateforme-digitale', id: 'nav-plateforme' },
    { label: 'Ressources', path: '/ressources', id: 'nav-ressources' },
    { label: 'À propos', path: '#', id: 'nav-about' },
  ];
}
