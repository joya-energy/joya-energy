import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';
import {
  lucideCalculator,
  lucideWrench,
  lucideBarChart3,
  lucideArrowRight,
} from '@ng-icons/lucide';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-landing-how-it-works',
  standalone: true,
  imports: [CommonModule, NgIconComponent, LandingBadgeComponent],
  templateUrl: './landing-how-it-works.component.html',
  styleUrl: './landing-how-it-works.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideCalculator,
      lucideWrench,
      lucideBarChart3,
      lucideArrowRight,
    }),
  ],
})
export class LandingHowItWorksComponent {
  protected readonly steps: Step[] = [
    {
      number: '01',
      title: 'Analyse & diagnostic énergétique',
      description: ' Analyse de votre consommation, de vos usages et de votre site afin d’identifier les leviers de performance énergétique les plus pertinents.',
      icon: 'lucideCalculator',
    },
    {
      number: '02',
      title: 'Déploiement de la solution',
      description: 'Conception et mise en œuvre de la solution énergétique adaptée à votre site, avec une prise en charge complète des aspects techniques.',
      icon: 'lucideWrench',
    },
    {
      number: '03',
      title: 'Suivi & performance dans le temps',
      description: 'Pilotage continu de la consommation, de la production et des économies réalisées grâce à notre plateforme digitale.',
      icon: 'lucideBarChart3',
    },
  ];
}
