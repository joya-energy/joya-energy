import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
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

  protected readonly faqItems: FaqItem[] = FAQ_ITEMS.slice(0, 6);

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
}
