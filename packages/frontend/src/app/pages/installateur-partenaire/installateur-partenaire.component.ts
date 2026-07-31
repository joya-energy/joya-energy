import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideClipboardList,
  lucideShield,
  lucideZap,
  lucideTrendingUp,
} from '@ng-icons/lucide';
import { SEOService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';

interface PartnerStat {
  value: string;
  title: string;
  subtitle: string;
}

interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

interface AdvantageCard {
  icon: string;
  title: string;
  description: string;
}

interface ExpectationItem {
  number: string;
  text: string;
}

@Component({
  selector: 'app-installateur-partenaire',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './installateur-partenaire.component.html',
  styleUrl: './installateur-partenaire.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideClipboardList,
      lucideShield,
      lucideZap,
      lucideTrendingUp,
    }),
  ],
})
export class InstallateurPartenaireComponent implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);

  /** Installer registration form in the Joya Energy customer app (monorepo). */
  protected readonly devenirPartenaireUrl = `${environment.customerAppUrl.replace(/\/$/, '')}/installateurs`;

  protected scrollToProcessus(event: Event): void {
    event.preventDefault();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    document.getElementById('processus')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected readonly stats: PartnerStat[] = [
    {
      value: '4',
      title: 'Installateurs partenaires',
      subtitle: 'Réseau actif Joya Energy',
    },
    {
      value: '50 kWc',
      title: 'Installés via le réseau',
      subtitle: 'Et ça continue',
    },
    {
      value: '48h',
      title: 'Délai de paiement après réception',
      subtitle: 'Défini dès la commande',
    },
    {
      value: '0 TND',
      title: 'Avancé par le client final',
      subtitle: 'Contrat de service à la performance',
    },
  ];

  protected readonly processSteps: ProcessStep[] = [
    {
      number: '01',
      title: 'Qualification',
      description:
        'Validation du site, de la viabilité technique et du profil financier du client final.',
    },
    {
      number: '02',
      title: 'Contrat client',
      description:
        'Joya Energy signe le contrat de service à la performance avec le client final.',
      },
      {
        number: '03',
        title: 'Installation',
        description:
          'Vous réalisez les travaux selon le cahier des charges technique Joya Energy.',
      },
      {
        number: '04',
        title: 'Réception & paiement',
        description:
          'Contrôle qualité à la réception, puis paiement selon le cycle défini.',
      },
      {
        number: '05',
        title: 'Suivi',
        description:
          'Monitoring de performance continu via Joya Energy OS, en coordination avec vos équipes.',
      },
    ];

  protected readonly advantages: AdvantageCard[] = [
    {
      icon: 'lucideClipboardList',
      title: 'Plus de chantiers',
      description:
        'Accédez à un flux régulier de projets PME déjà qualifiés et financés par Joya Energy.',
    },
    {
      icon: 'lucideShield',
      title: 'Zéro risque client',
      description:
        'Le client n’avance rien : Joya Energy structure le contrat et porte le risque de paiement.',
    },
    {
      icon: 'lucideZap',
      title: 'Paiement rapide',
      description:
        'Délai de paiement défini dès la commande, déclenché après réception des travaux.',
    },
    {
      icon: 'lucideTrendingUp',
      title: 'Volume, pas one-shot',
      description:
        'Un partenariat conçu pour enchaîner les projets, pas pour un seul chantier isolé.',
    },
  ];

  protected readonly expectations: ExpectationItem[] = [
    {
      number: '01',
      text: "Capacité d'installation solaire PV commerciale/industrielle (certifications, références clients).",
    },
    {
      number: '02',
      text: 'Respect du cahier des charges technique Joya Energy : équipements, normes, délais contractuels.',
    },
    {
      number: '03',
      text: 'Disponibilité pour le suivi M&V post-installation en coordination avec les équipes Joya Energy.',
    },
  ];

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Installateur Partenaire | JOYA Energy',
      description:
        'Rejoignez le réseau d’installateurs partenaires Joya Energy : projets solaires PME couverts par un contrat de service à la performance, paiement rapide, zéro avance client.',
      url: 'https://joya-energy.com/installateur-partenaire',
      keywords:
        'installateur partenaire Tunisie, réseau installateurs solaires, ESCO Tunisie, Joya Energy partenaires',
    });
  }
}
