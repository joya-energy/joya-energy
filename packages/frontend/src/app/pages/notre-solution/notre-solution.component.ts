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
      title: 'Modèle ESCo & Solution Énergétique Entreprise | Joya Energy',
      description:
        'Joya Energy finance, installe et pilote votre projet via un contrat ESCo et de garantie de performance énergétique. Découvrez notre modèle',
      url: 'https://joya-energy.com/notre-solution',
      keywords:
        'solution énergétique Tunisie, énergie solaire Tunisie, panneaux solaires Tunisie, transition énergétique Tunisie, audit énergétique Tunisie, Tunisia',
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
        'Conception, financement et pose de centrales photovoltaïques sur mesure via notre modèle ESCo avantageux.',
      icon: 'lucideSun',
    },
    {
      id: 'piloter',
      title: 'Piloter la performance',
      description:
        'Suivi de la consommation, de la production solaire et des économies réalisées.',
      icon: 'lucideLineChart',
    },
  ];
}
