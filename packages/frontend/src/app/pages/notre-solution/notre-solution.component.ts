import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBarChart2,
  lucideSun,
  lucideLineChart,
  lucideCheck,
  lucideCheckCircle,
} from '@ng-icons/lucide';

interface SolutionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-notre-solution',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './notre-solution.component.html',
  styleUrl: './notre-solution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideBarChart2,
      lucideSun,
      lucideLineChart,
      lucideCheckCircle,
    }),
  ],
})
export class NotreSolutionComponent {
  protected readonly cards: SolutionCard[] = [
    {
      id: 'comprendre',
      title: 'Comprendre votre énergie',
      description:
        'Analyse de votre consommation, de vos usages et de votre site pour identifier les leviers réels de performance énergétique.',
      icon: 'lucideBarChart2',
    },
    {
      id: 'deployer',
      title: 'Déployer la bonne solution',
      description:
        "Conception et mise en œuvre d'une solution énergétique adaptée à votre site, intégrant production solaire et optimisation des usages.",
      icon: 'lucideSun',
    },
    {
      id: 'piloter',
      title: 'Piloter la performance',
      description:
        'Suivi continu de la consommation, de la production et des économies via la plateforme digitale Joya.',
      icon: 'lucideLineChart',
    },
  ];
}
