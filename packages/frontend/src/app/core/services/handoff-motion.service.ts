import { Injectable, PLATFORM_ID, inject, DestroyRef } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Ports handoff motion: body.is-loaded, .reveal → .is-live,
 * GSAP ScrollTrigger + Lenis when available, cine-on / cine-off fallback.
 */
@Injectable({ providedIn: 'root' })
export class HandoffMotionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private revealIo: IntersectionObserver | null = null;
  private staggerIos: IntersectionObserver[] = [];
  private stepIos: IntersectionObserver[] = [];
  private reportIo: IntersectionObserver | null = null;
  private impactHoverTimer: ReturnType<typeof setTimeout> | null = null;
  private impactMoveHandler: (() => void) | null = null;
  private impactLeaveHandler: (() => void) | null = null;
  private lenis: {
    raf: (t: number) => void;
    destroy: () => void;
    on: Function;
    scrollTo: (target: number | string, opts?: { immediate?: boolean }) => void;
  } | null = null;
  private gsapTick: ((time: number) => void) | null = null;
  private started = false;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshQueued = false;
  private refreshing = false;

  private gsapRef: any = null;
  private scrollTriggerRef: any = null;
  private animContext: { revert: () => void } | null = null;

  start(): void {
    if (!isPlatformBrowser(this.platformId) || this.started) return;
    this.started = true;

    const root = this.document.documentElement;
    const body = this.document.body;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.setTimeout(() => body.classList.add('is-loaded'), 40);

    void this.initLibs(reduce, root, body).then(() => {
      this.setupReveal(reduce);
      this.refresh();
    });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.scrollToTop();
        this.scheduleRefresh(120);
      });

    this.destroyRef.onDestroy(() => this.teardown());
  }

  /** Debounced refresh — pages call this after view init / route change. */
  scheduleRefresh(delayMs = 80): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshQueued = true;
    this.refreshTimer = setTimeout(() => {
      this.refreshQueued = false;
      this.runRefresh();
    }, delayMs);
  }

  /** @deprecated Prefer scheduleRefresh — kept as alias so existing callers debounce. */
  refresh(): void {
    this.scheduleRefresh();
  }

  private runRefresh(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.refreshing) {
      this.scheduleRefresh(160);
      return;
    }
    this.refreshing = true;

    try {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.setupReveal(reduce);

      if (this.safetyTimer) clearTimeout(this.safetyTimer);
      this.safetyTimer = setTimeout(() => {
        this.document.querySelectorAll('.reveal:not(.is-live)').forEach((el) => {
          el.classList.add('is-live');
        });
        const stuck =
          '.cine-on [data-anim], [data-stagger] > *, .sgrid > *, .method-list > *, .pg-cards > *, .blog-grid > *, .contact-grid > *, .faq-list > *, .intro-highlights > *';
        this.document.querySelectorAll(stuck).forEach((el) => {
          const style = window.getComputedStyle(el);
          if (parseFloat(style.opacity) < 0.05) {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.transform = 'none';
          }
        });
      }, 2200);

      if (this.gsapRef && this.scrollTriggerRef) {
        this.animContext?.revert();
        this.clearObservers();
        this.animContext = this.gsapRef.context(() => {
          this.wireScrollAnimations(this.gsapRef, this.scrollTriggerRef);
        });
        this.scrollTriggerRef.refresh();
      } else {
        this.clearObservers();
      }

      // After observers reset — wire report section reveals (.rp-anim)
      this.wireReportAnimations(reduce);
      this.wireLoopGraphs();
    } finally {
      this.refreshing = false;
    }
  }

  private async initLibs(
    reduce: boolean,
    root: HTMLElement,
    body: HTMLElement
  ): Promise<void> {
    if (reduce) {
      root.classList.add('cine-off');
      root.classList.remove('cine-on');
      return;
    }

    try {
      const [{ default: gsap }, { ScrollTrigger }, lenisMod] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis'),
      ]);
      const Lenis = (lenisMod as { default: new (opts: object) => any }).default;

      this.gsapRef = gsap;
      this.scrollTriggerRef = ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      root.classList.add('cine-on');
      root.classList.remove('cine-off');
      body.classList.remove('no-gsap');

      const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
      if (fine) {
        const lenis = new Lenis({
          duration: 1.05,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          smoothWheel: true,
          wheelMultiplier: 1,
          // Let overflow menus / panels (ui-select, dialogs) scroll with the wheel
          allowNestedScroll: true,
          prevent: (node: HTMLElement) =>
            node.hasAttribute('data-lenis-prevent') ||
            node.hasAttribute('data-lenis-prevent-wheel') ||
            node.classList.contains('ui-select-dropdown') ||
            node.classList.contains('msel__p'),
        });
        this.lenis = lenis;
        lenis.on('scroll', ScrollTrigger.update);
        this.gsapTick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(this.gsapTick);
        gsap.ticker.lagSmoothing(0);
        root.classList.add('has-smooth');
      }

      this.animContext = gsap.context(() => {
        this.wireScrollAnimations(gsap, ScrollTrigger);
      });
    } catch {
      root.classList.add('cine-off');
      root.classList.remove('cine-on');
    }
  }

  private wireScrollAnimations(gsap: any, ScrollTrigger: any): void {
    // Scrubbed [data-anim] reveals
    (gsap.utils.toArray('[data-anim]') as HTMLElement[]).forEach((el) => {
      const kind = el.getAttribute('data-anim');
      const from: Record<string, number> = {
        autoAlpha: 0,
        y: kind === 'up-lg' ? 72 : 34,
      };
      if (kind === 'scale') {
        from['scale'] = 0.94;
        from['y'] = 30;
      }
      gsap.fromTo(el, from, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        ease: 'none',
        overwrite: 'auto',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'top 52%',
          scrub: true,
        },
      });
    });

    // Landing howto timeline — replay on enter (handoff index.js)
    const howto = this.document.getElementById('howtoSteps') as HTMLElement | null;
    const howtoSteps = howto
      ? (gsap.utils.toArray('#howtoSteps .howto__step') as HTMLElement[])
      : [];
    if (howto && howtoSteps.length) {
      const htl = gsap.timeline({ paused: true });
      htl.fromTo(
        howto,
        { '--line': 0 },
        { '--line': 1, duration: 0.9, ease: 'power2.inOut' },
        0
      );
      howtoSteps.forEach((st, i) => {
        htl.fromTo(
          st.querySelectorAll('.howto__step__n, .howto__step__t, .howto__step__d'),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.06 },
          0.16 + i * 0.26
        );
      });
      const hio = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) htl.restart();
          else htl.pause(0);
        },
        { threshold: 0.25 }
      );
      hio.observe(howto);
      this.stepIos.push(hio);
    }

    // Impact parallax + count-up
    this.wireImpact(gsap, ScrollTrigger);

    // Solution model bars + partenaire portal chart
    this.wireIllustrations(gsap);

    // Ressources hero steps (#resSteps)
    const resWrap = this.document.getElementById('resSteps');
    if (resWrap) {
      const steps = gsap.utils.toArray('#resSteps .res-step') as HTMLElement[];
      if (steps.length) {
        const tl = gsap.timeline({ paused: true });
        steps.forEach((st, i) => {
          const at = i * 0.3;
          const rule = st.querySelector('.res-step__rule');
          const inner = st.querySelector('.res-step__in');
          if (rule) {
            tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, at);
          }
          if (inner) {
            tl.fromTo(
              inner,
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
              at + 0.22
            );
          }
        });
        const io = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) tl.restart();
            else tl.pause(0);
          },
          { threshold: 0.2 }
        );
        io.observe(resWrap);
        this.stepIos.push(io);
      }
    }

    // Content-page step blocks [data-steps]
    (gsap.utils.toArray('[data-steps]') as HTMLElement[]).forEach((wrap) => {
      const steps = gsap.utils.toArray('.pg-step', wrap) as HTMLElement[];
      if (!steps.length) return;
      const tl = gsap.timeline({ paused: true });
      steps.forEach((st, i) => {
        const at = i * 0.3;
        const rule = st.querySelector('.pg-step__rule');
        const inner = st.querySelector('.pg-step__in');
        if (rule) {
          tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, at);
        }
        if (inner) {
          tl.fromTo(
            inner,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
            at + 0.22
          );
        }
      });
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) tl.restart();
          else tl.pause(0);
        },
        { threshold: 0.2 }
      );
      io.observe(wrap);
      this.stepIos.push(io);
    });

    // Stagger grids: explicit [data-stagger] + known card groups
    const staggerTargets: HTMLElement[] = [
      ...(gsap.utils.toArray('[data-stagger]') as HTMLElement[]),
      ...(gsap.utils.toArray('.sgrid') as HTMLElement[]),
      ...(gsap.utils.toArray('.method-list') as HTMLElement[]),
      ...(gsap.utils.toArray('.pg-cards') as HTMLElement[]),
      ...(gsap.utils.toArray('.blog-grid') as HTMLElement[]),
      ...(gsap.utils.toArray('.contact-grid') as HTMLElement[]),
      ...(gsap.utils.toArray('.faq-list') as HTMLElement[]),
      ...(gsap.utils.toArray('.intro-highlights') as HTMLElement[]),
      ...(gsap.utils.toArray('.solutions-grid') as HTMLElement[]),
    ];
    const seen = new Set<HTMLElement>();
    staggerTargets.forEach((grid) => {
      if (seen.has(grid)) return;
      seen.add(grid);
      const items = Array.from(grid.children) as HTMLElement[];
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 24 });
      const cio = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          cio.disconnect();
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            stagger: 0.14,
          });
        },
        { threshold: 0.15 }
      );
      cio.observe(grid);
      this.staggerIos.push(cio);
    });

    // Featured simulator block
    (gsap.utils.toArray('.sfeat') as HTMLElement[]).forEach((el) => {
      if (el.hasAttribute('data-anim')) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 34 },
        {
          autoAlpha: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            end: 'top 52%',
            scrub: true,
          },
        }
      );
    });

    // CTA blocks
    this.wireCta(gsap, 'resCta', 'resCtaBg', 'resCtaTitle', null, 'resCtaBtn');
    this.wireCta(gsap, 'pgCta', 'pgCtaBg', 'pgCtaTitle', 'pgCtaSub', 'pgCtaBtn');

    ScrollTrigger.refresh();
  }

  private scrollToTop(): void {
    if (this.lenis) {
      this.lenis.scrollTo(0, { immediate: true });
      return;
    }
    window.scrollTo(0, 0);
  }

  private wireIllustrations(gsap: any): void {
    const model = this.document.getElementById('model');
    if (model) {
      const bars = gsap.utils.toArray('.model__bar', model) as HTMLElement[];
      if (bars.length) {
        gsap.set(bars, { scaleY: 0, transformOrigin: '50% 100%' });
        const mio = new IntersectionObserver(
          (entries) => {
            if (!entries[0]?.isIntersecting) return;
            mio.disconnect();
            gsap.to(bars, {
              scaleY: 1,
              duration: 0.85,
              ease: 'power2.out',
              stagger: 0.14,
            });
          },
          { threshold: 0.35 }
        );
        mio.observe(model);
        this.staggerIos.push(mio);
      }
    }

    const portal = this.document.getElementById('portal');
    if (portal) {
      const fills = Array.from(portal.querySelectorAll('.pj__bar i.on')) as HTMLElement[];
      fills.forEach((el) => el.style.setProperty('--pj-fill', '0'));

      const clip = portal.querySelector('.pc__clip') as SVGRectElement | null;
      const dots = gsap.utils.toArray('.pc__dot', portal) as HTMLElement[];
      const pio = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          pio.disconnect();
          fills.forEach((el, i) => {
            gsap.fromTo(
              el,
              { '--pj-fill': 0 },
              { '--pj-fill': 1, duration: 0.55, delay: i * 0.08, ease: 'power2.out' }
            );
          });
          if (clip) {
            gsap.fromTo(
              clip,
              { attr: { width: 0 } },
              { attr: { width: 300 }, duration: 1.35, ease: 'power2.inOut' }
            );
          }
          if (dots.length) {
            gsap.fromTo(
              dots,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.35,
                stagger: 0.06,
                delay: 0.35,
                ease: 'back.out(1.6)',
              }
            );
          }
        },
        { threshold: 0.3 }
      );
      pio.observe(portal);
      this.staggerIos.push(pio);
    }
  }

  private wireCta(
    gsap: any,
    ctaId: string,
    bgId: string,
    titleId: string,
    subId: string | null,
    btnId: string
  ): void {
    const cta = this.document.getElementById(ctaId);
    if (!cta) return;
    const ctaBg = this.document.getElementById(bgId);
    const ctaTitle = this.document.getElementById(titleId);
    const ctaSub = subId ? this.document.getElementById(subId) : null;
    const ctaBtn = this.document.getElementById(btnId);

    // Handoff: split title into words/letters for blur stagger (once)
    const ctaLetters = ctaTitle ? this.splitCtaTitle(ctaTitle) : [];

    const ctl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: cta, start: 'top 83%', once: true },
    });
    if (ctaBg) {
      ctl.from(ctaBg, { autoAlpha: 0, y: 60, scale: 0.95, duration: 1.0 }, 0);
    }
    if (ctaTitle) {
      ctl.from(ctaTitle, { autoAlpha: 0, y: 28, duration: 0.8 }, 0.42);
    }
    if (ctaLetters.length) {
      // Letter cascade (handoff). Avoid per-glyph filter blur — it locks Chromium.
      ctl.from(
        ctaLetters,
        { autoAlpha: 0, y: 12, duration: 0.42, stagger: 0.02, force3D: true },
        0.48
      );
    }
    if (ctaSub) {
      ctl.from(ctaSub, { autoAlpha: 0, y: 20, duration: 0.55 }, '>-0.3');
    }
    if (ctaBtn) {
      ctl.from(ctaBtn, { autoAlpha: 0, y: 20, duration: 0.55 }, '>-0.15');
    }
  }

  /** Port of handoff content-pages.js / ressources.js title letter split. */
  private splitCtaTitle(ctaTitle: HTMLElement): HTMLElement[] {
    if (ctaTitle.dataset['ctaSplit'] === '1') {
      return Array.from(ctaTitle.querySelectorAll('.ct-l')) as HTMLElement[];
    }

    const letters: HTMLElement[] = [];
    const label = Array.from(ctaTitle.childNodes)
      .map((n) => (n.nodeType === Node.TEXT_NODE ? n.textContent ?? '' : ' '))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (label) {
      ctaTitle.setAttribute('aria-label', label);
    }

    const frag = this.document.createDocumentFragment();
    Array.from(ctaTitle.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        text.split(/([ \t\r\n]+)/).forEach((chunk) => {
          if (chunk === '') return;
          if (/^[ \t\r\n]+$/.test(chunk)) {
            frag.appendChild(this.document.createTextNode(' '));
            return;
          }
          const word = this.document.createElement('span');
          word.className = 'ct-w';
          chunk.split('').forEach((ch) => {
            const letter = this.document.createElement('span');
            letter.className = 'ct-l';
            letter.textContent = ch;
            letter.setAttribute('aria-hidden', 'true');
            word.appendChild(letter);
            letters.push(letter);
          });
          frag.appendChild(word);
        });
        return;
      }
      frag.appendChild(node.cloneNode(true));
    });

    ctaTitle.textContent = '';
    ctaTitle.appendChild(frag);
    ctaTitle.dataset['ctaSplit'] = '1';
    return letters;
  }

  private wireImpact(gsap: any, ScrollTrigger: any): void {
    const impact = this.document.getElementById('impact');
    if (!impact) return;

    const bg = this.document.getElementById('impactBg');
    // Soft parallax on the absolute bg only (px, not yPercent) — avoids
    // ScrollTrigger scroll-height bloat / white gaps under the section.
    if (bg) {
      gsap.fromTo(
        bg,
        { y: -48, scale: 1.12 },
        {
          y: 64,
          scale: 1.12,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: impact,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    if (this.impactMoveHandler) {
      impact.removeEventListener('mousemove', this.impactMoveHandler);
    }
    if (this.impactLeaveHandler) {
      impact.removeEventListener('mouseleave', this.impactLeaveHandler);
    }
    this.impactMoveHandler = (): void => {
      impact.classList.add('is-hover');
      if (this.impactHoverTimer) clearTimeout(this.impactHoverTimer);
      this.impactHoverTimer = setTimeout(() => impact.classList.remove('is-hover'), 900);
    };
    this.impactLeaveHandler = (): void => {
      if (this.impactHoverTimer) clearTimeout(this.impactHoverTimer);
      impact.classList.remove('is-hover');
    };
    impact.addEventListener('mousemove', this.impactMoveHandler);
    impact.addEventListener('mouseleave', this.impactLeaveHandler);
  }

  /** Handoff: .jg / .jchart loop only while on screen. */
  private wireLoopGraphs(): void {
    const graphs = Array.from(
      this.document.querySelectorAll('.jchart, .jg')
    ) as HTMLElement[];
    if (!graphs.length) return;

    if (!('IntersectionObserver' in window)) {
      graphs.forEach((el) => el.classList.add('jg-run'));
      return;
    }

    const loopIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle('jg-run', e.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    graphs.forEach((el) => loopIo.observe(el));
    this.staggerIos.push(loopIo);
  }

  private clearObservers(): void {
    this.staggerIos.forEach((io) => io.disconnect());
    this.staggerIos = [];
    this.stepIos.forEach((io) => io.disconnect());
    this.stepIos = [];
    this.reportIo?.disconnect();
    this.reportIo = null;
  }

  /**
   * Handoff simulator report reveals: `.rp-anim [data-sec]` → `.is-in`
   * (CSS in `_simulator-report.scss` animates `[data-a]` children).
   */
  private wireReportAnimations(reduce: boolean): void {
    const sections = Array.from(
      this.document.querySelectorAll<HTMLElement>('.rp-anim [data-sec]')
    );
    if (!sections.length) return;

    sections.forEach((sec) => {
      const items = Array.from(sec.querySelectorAll<HTMLElement>('[data-a]'));
      items.forEach((el, index) => {
        if (!el.style.getPropertyValue('--i')) {
          el.style.setProperty('--i', String(index));
        }
      });
    });

    if (reduce || !('IntersectionObserver' in window)) {
      sections.forEach((sec) => sec.classList.add('is-in'));
      return;
    }

    this.reportIo?.disconnect();
    this.reportIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          this.reportIo?.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );

    sections.forEach((sec) => {
      if (sec.classList.contains('is-in')) return;
      const rect = sec.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.9 && rect.bottom > 40;
      if (inView) {
        sec.classList.add('is-in');
      } else {
        this.reportIo?.observe(sec);
      }
    });
  }

  private setupReveal(reduce: boolean): void {
    const els = Array.from(this.document.querySelectorAll('.reveal:not(.is-live)'));
    if (!els.length) return;

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-live'));
      return;
    }

    this.revealIo?.disconnect();
    this.revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-live');
            this.revealIo?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((el) => this.revealIo!.observe(el));
  }

  private teardown(): void {
    this.revealIo?.disconnect();
    this.revealIo = null;
    this.clearObservers();
    if (this.gsapTick) {
      void import('gsap').then(({ default: gsap }) => {
        if (this.gsapTick) gsap.ticker.remove(this.gsapTick);
      });
      this.gsapTick = null;
    }
    this.lenis?.destroy();
    this.lenis = null;
    this.animContext?.revert();
    this.animContext = null;
  }
}
