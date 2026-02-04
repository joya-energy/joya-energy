import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PerformanceIconsComponent,
  type RessourcesIconName,
} from '../performance-icons/performance-icons.component';

interface WhyItem {
  icon: RessourcesIconName;
  title: string;
  description: string;
}

@Component({
  selector: 'app-ressources-why-section',
  standalone: true,
  imports: [CommonModule, PerformanceIconsComponent],
  templateUrl: './ressources-why-section.component.html',
  styleUrl: './ressources-why-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RessourcesWhySectionComponent {
  protected readonly items: WhyItem[] = [
    {
      icon: 'clarify',
      title: 'Clarifiez votre situation',
      description:
        'Obtenez un diagnostic précis de votre consommation, de votre potentiel solaire ou de votre impact carbone.',
    },
    {
      icon: 'savings',
      title: "Identifiez les gisements d'économies",
      description:
        'Chiffrez rapidement les économies potentielles et la rentabilité de vos projets.',
    },
    {
      icon: 'plan',
      title: 'Planifiez vos actions',
      description:
        'Prenez des décisions éclairées basées sur des données objectives pour construire votre feuille de route énergétique.',
    },
  ];
}
