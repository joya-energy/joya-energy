import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';
import { FAQ_ITEMS, FaqItem } from '../../shared/data/faq.data';
import { PreAuditSolaireComponent } from '../pre-audit-solaire/pre-audit-solaire.component';
import { HeroOsDashboardComponent } from './components/hero-os-dashboard/hero-os-dashboard.component';

interface SectorTriCol {
  value: number;
  height: string;
  delay: string;
  label: string;
}

interface SectorTriGraph {
  kind: 'tri';
  title: string;
  ariaLabel: string;
  cols: SectorTriCol[];
}

interface SectorGaugeGraph {
  kind: 'gauge';
  title: string;
  ariaLabel: string;
  value: number;
  offset: string;
  label: string;
}

interface SectorTeaser {
  n: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
  alt: string;
  graph: SectorTriGraph | SectorGaugeGraph;
}

interface ImpactStat {
  from: number;
  to: number;
  prefix: string;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, PreAuditSolaireComponent, HeroOsDashboardComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LandingComponent implements OnInit, AfterViewInit {
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  private readonly impactSection = viewChild<ElementRef<HTMLElement>>('impactSection');

  protected readonly faqItems: FaqItem[] = FAQ_ITEMS.slice(0, 6);

  protected readonly impactStats: ImpactStat[] = [
    { from: 0, to: 7700, prefix: '', suffix: '\u00a0DT', label: 'économisés par an' },
    { from: 0, to: 14, prefix: '', suffix: '\u00a0t', label: 'de CO₂ évitées par an' },
    {
      from: 0,
      to: 20,
      prefix: "Jusqu'à\u00a0",
      suffix: '%',
      label: "d'économies sur la facture",
    },
    { from: 100000, to: 0, prefix: '', suffix: '\u00a0DT', label: 'investi par nos clients' },
  ];

  private impactIo: IntersectionObserver | null = null;
  private impactRafs: number[] = [];
  private impactTimers: ReturnType<typeof setTimeout>[] = [];

  protected readonly sectors: SectorTeaser[] = [
    {
      n: '01',
      title: 'Industrie & agroalimentaire',
      body: 'Vos machines tournent le jour, le soleil aussi. Joya investit, votre facture baisse.',
      bullets: [
        'Facture réduite dès le 1er mois',
        'Zéro immobilisation de capital',
        'Maintenance et garantie de performance incluse',
      ],
      image: '/handoff/images/sector-industry-power-plant-solar-wind.jpg',
      alt: 'Centrale industrielle avec panneaux solaires et éoliennes au coucher du soleil',
      graph: {
        kind: 'tri',
        title: 'Résultats concrets',
        ariaLabel:
          'Industrie et agroalimentaire : réduction CO₂ 38 %, économies annuelles 31 %, valorisation 12 %.',
        cols: [
          { value: 38, height: '76%', delay: '0s', label: 'Réduction CO₂' },
          { value: 31, height: '62%', delay: '.14s', label: 'Économies annuelles' },
          { value: 12, height: '24%', delay: '.28s', label: 'Valorisation' },
        ],
      },
    },
    {
      n: '02',
      title: 'Éducation & santé',
      body: 'Écoles, cliniques : des charges allégées sans toucher à votre budget.',
      bullets: [
        'Charges fixes réduites',
        "Budget d'investissement préservé",
        'Économies suivies dans Joya OS',
      ],
      image: '/handoff/images/sector-tertiary-wind-turbine-hills.jpg',
      alt: 'Éoliennes sur des collines dorées au coucher du soleil',
      graph: {
        kind: 'tri',
        title: 'Résultats concrets',
        ariaLabel:
          'Éducation et santé : réduction CO₂ 30 %, économies annuelles 18 %, valorisation 12 %.',
        cols: [
          { value: 30, height: '60%', delay: '0s', label: 'Réduction CO₂' },
          { value: 18, height: '36%', delay: '.14s', label: 'Économies annuelles' },
          { value: 12, height: '24%', delay: '.28s', label: 'Valorisation' },
        ],
      },
    },
    {
      n: '03',
      title: 'Hôtellerie & commerce',
      body: 'Climatisation, froid, éclairage : vos pics de facture deviennent des économies.',
      bullets: [
        'Moins exposé aux hausses STEG',
        'Risques portés par Joya',
        'Installation clé en main',
      ],
      image: '/handoff/images/sector-agriculture-aerial-wind-turbine.jpg',
      alt: 'Éolienne vue du ciel au milieu de champs cultivés',
      graph: {
        kind: 'gauge',
        title: 'Incitations énergétiques',
        ariaLabel:
          'Hôtellerie et commerce : incitations et avantages fiscaux, estimés à 12 % du coût du projet.',
        value: 12,
        offset: '110',
        label: 'Incitations & avantages fiscaux',
      },
    },
  ];

  constructor() {
    afterNextRender(() => {
      this.wireImpactCounts();
    });
  }

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Joya Energy — Joya investit. Vous économisez.',
      description:
        "0 DT d'investissement initial. Joya installe et mesure, vous payez sur résultat, suivi en direct dans Joya OS.",
      url: 'https://joya-energy.com/',
      image: 'https://joya-energy.com/handoff/images/hero-solar-roof-sunset.jpg',
      keywords:
        'solaire Tunisie, énergie solaire PME, Joya Energy, tiers-investissement, économies énergie entreprise',
    });
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }

  private formatImpact(value: number): string {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  }

  private wireImpactCounts(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const section = this.impactSection()?.nativeElement;
    if (!section) return;

    this.destroyRef.onDestroy(() => {
      this.stopImpactCounts();
      this.impactIo?.disconnect();
      this.impactIo = null;
    });

    // Paint starting values once (no Angular CD loop).
    this.paintImpactStart(section);

    this.zone.runOutsideAngular(() => {
      if (!('IntersectionObserver' in window)) {
        this.playImpactCounts(section);
        return;
      }

      this.impactIo = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting) {
            this.playImpactCounts(section);
          } else {
            this.stopImpactCounts();
            this.paintImpactStart(section);
          }
        },
        { threshold: 0.2 }
      );
      this.impactIo.observe(section);
    });
  }

  private impactNodes(section: HTMLElement): HTMLElement[] {
    return Array.from(section.querySelectorAll<HTMLElement>('.impact-count'));
  }

  private paintImpactStart(section: HTMLElement): void {
    const nodes = this.impactNodes(section);
    this.impactStats.forEach((stat, index) => {
      const node = nodes[index];
      if (node) node.textContent = this.formatImpact(stat.from);
    });
  }

  private stopImpactCounts(): void {
    this.impactTimers.forEach((id) => clearTimeout(id));
    this.impactTimers = [];
    this.impactRafs.forEach((id) => cancelAnimationFrame(id));
    this.impactRafs = [];
  }

  private playImpactCounts(section: HTMLElement): void {
    this.stopImpactCounts();
    this.paintImpactStart(section);
    const nodes = this.impactNodes(section);

    this.impactStats.forEach((stat, index) => {
      const node = nodes[index];
      if (!node) return;

      const delayId = setTimeout(() => {
        const duration = stat.from > stat.to ? 2800 : 1600;
        const start = performance.now();

        const tick = (now: number): void => {
          const progress = Math.min(1, (now - start) / duration);
          const eased =
            stat.from > stat.to ? progress : 1 - Math.pow(1 - progress, 3);
          node.textContent = this.formatImpact(stat.from + (stat.to - stat.from) * eased);
          if (progress < 1) {
            this.impactRafs[index] = requestAnimationFrame(tick);
          }
        };

        this.impactRafs[index] = requestAnimationFrame(tick);
      }, index * 100);

      this.impactTimers.push(delayId);
    });
  }
}
