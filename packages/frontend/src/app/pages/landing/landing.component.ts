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
      title: 'Industrie',
      body: 'Réduisez vos coûts énergétiques et sécurisez votre production avec une énergie maîtrisée.',
      bullets: [
        'Analyse de vos pics de consommation',
        "Réduction directe sur la facture d'électricité",
        'Production sécurisée, sans coupure',
      ],
      image: '/handoff/images/sector-industry-power-plant-solar-wind.jpg',
      alt: 'Centrale industrielle avec panneaux solaires et éoliennes au coucher du soleil',
      graph: {
        kind: 'tri',
        title: 'Résultats concrets',
        ariaLabel: 'Industrie : réduction CO₂ 38 %, économies annuelles 31 %, valorisation 12 %.',
        cols: [
          { value: 38, height: '76%', delay: '0s', label: 'Réduction CO₂' },
          { value: 31, height: '62%', delay: '.14s', label: 'Économies annuelles' },
          { value: 12, height: '24%', delay: '.28s', label: 'Valorisation' },
        ],
      },
    },
    {
      n: '02',
      title: 'Tertiaire',
      body: 'Optimisez votre consommation et réduisez durablement vos charges énergétiques.',
      bullets: [
        'Pilotage fin de la consommation',
        'Charges énergétiques réduites durablement',
        'Confort maintenu, coûts maîtrisés',
      ],
      image: '/handoff/images/sector-tertiary-wind-turbine-hills.jpg',
      alt: 'Éoliennes sur des collines dorées au coucher du soleil',
      graph: {
        kind: 'tri',
        title: 'Résultats concrets',
        ariaLabel: 'Tertiaire : réduction CO₂ 30 %, économies annuelles 18 %, valorisation 12 %.',
        cols: [
          { value: 30, height: '60%', delay: '0s', label: 'Réduction CO₂' },
          { value: 18, height: '36%', delay: '.14s', label: 'Économies annuelles' },
          { value: 12, height: '24%', delay: '.28s', label: 'Valorisation' },
        ],
      },
    },
    {
      n: '03',
      title: 'Agriculture',
      body: 'Produisez votre propre énergie et réduisez votre dépendance aux prix du réseau.',
      bullets: [
        'Autonomie face aux prix du réseau',
        'Incitations et avantages fiscaux',
        'Énergie produite directement sur site',
      ],
      image: '/handoff/images/sector-agriculture-aerial-wind-turbine.jpg',
      alt: 'Éolienne vue du ciel au milieu de champs cultivés',
      graph: {
        kind: 'gauge',
        title: 'Incitations énergétiques',
        ariaLabel:
          'Agriculture : incitations et avantages fiscaux, estimés à 12 % du coût du projet.',
        value: 12,
        offset: '110',
        label: 'Incitations & avantages fiscaux',
      },
    },
  ];

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Joya Energy — Passez au solaire. Payez moins cher.',
      description:
        "Installation, suivi et service énergétique en un seul contrat. 0 DT d'investissement initial pour les PME en Tunisie.",
      url: 'https://joya-energy.com/',
      image: 'https://joya-energy.com/handoff/images/hero-solar-roof-sunset.jpg',
      keywords:
        'solaire Tunisie, énergie solaire PME, Joya Energy, service énergétique, panneaux solaires entreprise',
    });
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }
}
