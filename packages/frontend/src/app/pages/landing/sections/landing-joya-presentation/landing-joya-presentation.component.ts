import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';
import {
  lucideZap,
  lucideFileSearch,
  lucideReceipt,
  lucideSun,
  lucideBarChart3,
  lucideArrowRight,
} from '@ng-icons/lucide';

interface PresentationCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  ctaText: string;
  ctaLink: string;
  isFeatured?: boolean;
}

@Component({
  selector: 'app-landing-joya-presentation',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent, LandingBadgeComponent],
  templateUrl: './landing-joya-presentation.component.html',
  styleUrl: './landing-joya-presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideZap,
      lucideFileSearch,
      lucideReceipt,
      lucideSun,
      lucideBarChart3,
      lucideArrowRight,
    }),
  ],
})
export class LandingJoyaPresentationComponent {
  protected readonly cards: PresentationCard[] = [
    {
      id: 'featured',
      title: 'La solution énergétique clé en main pour votre entreprise',
      description:
        "Joya prend en charge l'ensemble de votre projet énergétique, de l'analyse initiale jusqu'au suivi de la performance dans le temps.",
      icon: 'lucideZap',
      ctaText: 'Lancer une étude énergétique',
      ctaLink: '/audit-solaire',
      isFeatured: true,
    },
    {
      id: 'analyse-facture',
      title: 'Analyse facture',
      description:
        'Décryptage de votre facture STEG pour comprendre vos postes de consommation et identifier rapidement les opportunités d’économies.',
      icon: 'lucideReceipt',
      ctaText: 'En savoir plus',
      ctaLink: '/analyse-facture',
    },
    {
      id: 'audit',
      title: 'Audit énergétique intelligent',
      description:
        "Analyse de votre consommation, de vos usages et de votre facture énergétique afin d'identifier les leviers d'optimisation les plus pertinents.",
      icon: 'lucideFileSearch',
      ctaText: 'En savoir plus',
      ctaLink: '/audit-energetique',
    },
    {
      id: 'production',
      title: 'Production solaire & optimisation des usages',
      description:
        "Conception et déploiement d'une solution énergétique adaptée à votre site pour réduire durablement votre dépendance au réseau.",
      icon: 'lucideSun',
      ctaText: 'En savoir plus',
      ctaLink: '/notre-solution',
    },
    {
      id: 'suivi',
      title: 'Pilotage et performance dans le temps',
      description:
        'Suivi continu de la consommation, de la production et des économies réalisées grâce à une plateforme digitale dédiée.',
      icon: 'lucideBarChart3',
      ctaText: 'En savoir plus',
      ctaLink: '/plateforme-digitale',
    },
  ];
}
