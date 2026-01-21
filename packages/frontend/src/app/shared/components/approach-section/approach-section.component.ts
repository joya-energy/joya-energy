import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ApproachStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-approach-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './approach-section.component.html',
  styleUrl: './approach-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApproachSectionComponent {
  protected readonly label = 'PROCESSUS SIMPLE';
  protected readonly title = 'Comment fonctionne notre solution énergétique';
  protected readonly subtitle = 'Une approche structurée pour améliorer durablement la performance énergétique de votre entreprise, sans complexité.';
  protected readonly ctaLabel = 'Découvrir notre approche';
  protected readonly ctaLink = '/notre-approche';
  
  protected readonly steps: ApproachStep[] = [
    {
      number: '01',
      title: 'Analyse & diagnostic énergétique',
      description: 'Analyse de votre consommation, de vos usages et de votre site afin d\'identifier les leviers de performance énergétique les plus pertinents.'
    },
    {
      number: '02',
      title: 'Déploiement de la solution',
      description: 'Conception et mise en œuvre de la solution énergétique adaptée à votre site, avec une prise en charge complète des aspects techniques.'
    },
    {
      number: '03',
      title: 'Suivi & performance dans le temps',
      description: 'Pilotage continu de la consommation, de la production et des économies réalisées grâce à notre plateforme digitale.'
    }
  ];
}


