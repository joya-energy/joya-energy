import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';
import {
  lucideZap,
  lucideFileSearch,
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
        'Joya Energy analyse votre situation, conçoit une solution adaptée et suit sa performance dans le temps.',
      icon: 'lucideZap',
      ctaText: 'Lancer une étude énergétique',
      ctaLink: '/audit-solaire',
      isFeatured: true,
    },
    {
      id: 'audit',
      title: 'Audit énergétique intelligent',
      description:
        "Analysez votre consommation, et votre surface pour dimensionner l'installation de panneaux photovoltaïques la plus rentable.",
      icon: 'lucideFileSearch',
      ctaText: 'En savoir plus',
      ctaLink: '/audit-energetique',
    },
    {
      id: 'production',
      title: 'Production solaire & optimisation des usages',
      description:
        'Déployez une solution solaire adaptée à votre site et à votre profil de consommation.',
      icon: 'lucideSun',
      ctaText: 'En savoir plus',
      ctaLink: '/notre-solution',
    },
    {
      id: 'suivi',
      title: 'Pilotage et performance dans le temps',
      description:
        'Suivez votre consommation, votre production solaire et les économies réalisées.',
      icon: 'lucideBarChart3',
      ctaText: 'En savoir plus',
      ctaLink: '/plateforme-digitale',
    },
  ];
}
