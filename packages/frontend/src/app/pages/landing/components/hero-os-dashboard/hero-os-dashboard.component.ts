import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Live Joya OS dashboard (HTML/CSS/SVG) with handoff count-up + chart animations.
 * CSS lives in styles/handoff/_index-page.scss (.hero-dash / .hd-*).
 */
@Component({
  selector: 'app-hero-os-dashboard',
  standalone: true,
  templateUrl: './hero-os-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class HeroOsDashboardComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  /** DOM id for this instance (heroOs / platOs). */
  readonly dashId = input.required<string>();
  /** When true, hide from AT (clone used inside plateforme laptop). */
  readonly decorative = input(false);
  /** Observe this selector for visibility (default: the dash itself). */
  readonly observeClosest = input<string | null>(null);

  protected readonly ariaLabel =
    'Tableau de bord Joya OS — 127 clients actifs (+8,2 %), 98 450 DT d’économies générées (+12,4 %), 245 MWh de production solaire (+10,1 %), 34 projets en cours (+6,7 %). Graphique de l’aperçu énergétique hebdomadaire, répartition des économies et liste des projets récents.';

  private io: IntersectionObserver | null = null;
  private resizeRo: ResizeObserver | null = null;
  private readonly timers = new Map<string | HTMLElement, ReturnType<typeof setTimeout>>();
  private live = false;
  private firstDone = false;
  private reduce = false;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.wireScaler();
    this.markLaptopLive();
    this.reset();

    const root = this.host.nativeElement.querySelector('.hero-dash') as HTMLElement | null;
    if (!root) return;

    const observeTarget = this.resolveObserveTarget(root);
    if (!('IntersectionObserver' in window)) {
      this.play(true);
      return;
    }

    this.io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !this.live) {
          this.live = true;
          this.play(!this.firstDone);
          this.firstDone = true;
        } else if (!visible && this.live) {
          this.live = false;
          this.reset();
        }
      },
      {
        threshold: this.observeClosest() ? 0.25 : 0,
        rootMargin: this.observeClosest() ? '0px' : '0px 0px -12% 0px',
      }
    );
    this.io.observe(observeTarget);

    // Safety: play once if observer never fires
    this.timers.set(
      'safety',
      setTimeout(() => {
        if (!this.live) {
          this.live = true;
          this.play(!this.firstDone);
          this.firstDone = true;
        }
      }, 1200)
    );
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.resizeRo?.disconnect();
    this.clearTimers();
  }

  private resolveObserveTarget(root: HTMLElement): Element {
    const sel = this.observeClosest();
    if (sel) {
      const closest = root.closest(sel);
      if (closest) return closest;
    }
    return root;
  }

  private markLaptopLive(): void {
    const lap = this.host.nativeElement.closest('.laptop');
    lap?.classList.add('is-live');
  }

  private wireScaler(): void {
    const scaler =
      (this.host.nativeElement.closest('.hero-laptop__scaler, .plat-scaler') as HTMLElement | null) ??
      null;
    const screen = scaler?.parentElement;
    if (!scaler || !screen) return;

    const fit = (): void => {
      if (screen.clientWidth) {
        scaler.style.setProperty('--s', (screen.clientWidth / 1040).toFixed(4));
      }
    };
    fit();
    if ('ResizeObserver' in window) {
      this.resizeRo = new ResizeObserver(fit);
      this.resizeRo.observe(screen);
    }
  }

  private clearTimers(): void {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
  }

  private fmt(value: number, dec: number): string {
    if (dec > 0) return value.toFixed(dec);
    return Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  private nums(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll('.hero-num'));
  }

  private dash(): HTMLElement | null {
    return this.host.nativeElement.querySelector('.hero-dash');
  }

  private reset(): void {
    this.clearTimers();
    const root = this.dash();
    root?.classList.remove('is-playing');
    this.nums().forEach((el) => {
      const dec = parseInt(el.dataset['dec'] || '0', 10);
      el.textContent = this.fmt(0, dec);
    });
  }

  private play(firstRun: boolean): void {
    this.clearTimers();
    const root = this.dash();
    if (!root) return;
    root.classList.add('is-in');
    const lead = firstRun ? 650 : 260;
    this.timers.set(
      'play',
      setTimeout(() => {
        root.classList.add('is-playing');
        this.nums().forEach((el, i) => {
          this.timers.set(
            el,
            setTimeout(() => this.countUp(el), i * 85)
          );
        });
      }, lead)
    );
  }

  private countUp(el: HTMLElement): void {
    const target = parseFloat(el.dataset['to'] || '0');
    const dec = parseInt(el.dataset['dec'] || '0', 10);
    const dur = this.reduce ? 650 : 1900;
    const start = Date.now();
    const tick = (): void => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = this.fmt(target * eased, dec);
      if (p < 1) this.timers.set(el, setTimeout(tick, 16));
      else this.timers.delete(el);
    };
    tick();
  }
}
