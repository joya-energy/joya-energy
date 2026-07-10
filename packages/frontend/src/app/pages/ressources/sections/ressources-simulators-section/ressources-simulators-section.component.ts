import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorCardComponent } from '../simulator-card/simulator-card.component';
import type { RessourcesIconName } from '../performance-icons/performance-icons.component';
import type { SimulatorAccentColor } from '../simulator-card/simulator-card.component';

interface SimulatorItem {
  icon: RessourcesIconName;
  title: string;
  description: string;
  features: { bold: string; text: string }[];
  buttonText: string;
  routerLink: string;
  accentColor: SimulatorAccentColor;
}

@Component({
  selector: 'app-ressources-simulators-section',
  standalone: true,
  imports: [CommonModule, SimulatorCardComponent],
  templateUrl: './ressources-simulators-section.component.html',
  styleUrl: './ressources-simulators-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RessourcesSimulatorsSectionComponent {
  protected readonly simulators: SimulatorItem[] = [
    {
      icon: 'solar',
      title: "Audit Solaire & Potentiel d'Économies",
      description: 'Visualisez le potentiel solaire de votre site en quelques minutes.',
      features: [
        { bold: 'Analyse instantanée', text: 'de votre potentiel solaire.' },
        { bold: 'Estimation précise', text: 'des coûts et aides financières.' },
        { bold: 'Projection claire', text: 'de vos économies sur 20 ans.' },
      ],
      buttonText: "Lancer l'Audit Solaire",
      routerLink: '/audit-solaire',
      accentColor: 'orange',
    },
    {
      icon: 'energy-audit',
      title: 'Audit Énergétique Complet',
      description: 'Obtenez une vue à 360° de la performance énergétique de votre bâtiment.',
      features: [
        { bold: 'Cartographie détaillée', text: 'de vos flux de consommation.' },
        { bold: 'Recommandations', text: 'chiffrées et priorisées.' },
        { bold: "Plan d'action concret", text: 'pour une meilleure efficacité.' },
      ],
      buttonText: "Démarrer l'Audit Énergétique",
      routerLink: '/audit-energetique',
      accentColor: 'teal',
    },
    {
      icon: 'carbon',
      title: "Calculateur d'Empreinte Carbone",
      description: "Mesurez l'impact environnemental de votre activité.",
      features: [
        { bold: 'Conformité', text: 'avec les standards de reporting.' },
        { bold: 'Visualisation simple', text: "de vos sources d'émissions." },
        { bold: "Pistes d'actions", text: 'pour votre stratégie bas-carbone.' },
      ],
      buttonText: 'Calculer mon Empreinte Carbone',
      routerLink: '/bilan-carbon',
      accentColor: 'teal',
    },
    {
      icon: 'bill',
      title: "Simulateur d'Analyse Facture",
      description: 'Comprenez votre facture STEG en quelques minutes.',
      features: [
        { bold: 'Décryptage automatique', text: 'de votre facture électricité et gaz.' },
        { bold: 'Visualisation claire', text: 'des postes de consommation et des montants.' },
        { bold: 'Opportunités d’économies', text: 'identifiées en quelques minutes.' },
      ],
      buttonText: "Lancer l'Analyse Facture",
      routerLink: '/analyse-facture',
      accentColor: 'orange',
    },
    {
      icon: 'subsidy',
      title: 'Simulateur des subventions',
      description: 'Estimez votre prime FTE en quelques minutes.',
      features: [
        { bold: 'Barème officiel FTE', text: 'études, équipements et photovoltaïque.' },
        { bold: 'Calcul instantané', text: 'selon votre type de projet.' },
        { bold: 'Prime non remboursable', text: "jusqu'à 70% de vos investissements." },
      ],
      buttonText: 'Lancer le simulateur',
      routerLink: '/simulateur-subventions',
      accentColor: 'teal',
    },
  ];
}
