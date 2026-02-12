import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
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
import { SEOService } from '../../core/services/seo.service';

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
export class NotreSolutionComponent implements OnInit {
  private seoService = inject(SEOService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Notre solution | JOYA Energy',
      description: 'Découvrez comment JOYA Energy conçoit et déploie des solutions énergétiques solaires adaptées à votre entreprise en Tunisie pour réduire durablement votre dépendance au réseau.',
      url: 'https://joya-energy.com/notre-solution',
      keywords: 'solution énergétique Tunisie, énergie solaire Tunisie, panneaux solaires Tunisie, transition énergétique Tunisie, audit énergétique Tunisie, Tunisia',
    });
  }
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
