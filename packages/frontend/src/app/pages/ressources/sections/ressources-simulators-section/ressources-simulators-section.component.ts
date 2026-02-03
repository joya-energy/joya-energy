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
      description:
        "Visualisez le potentiel solaire de votre site en quelques minutes. Notre simulateur analyse votre toiture, estime la production d'électricité et la rentabilité de votre future installation.",
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
      description:
        'Obtenez une vue à 360° de la performance énergétique de votre bâtiment. Identifiez vos postes de consommation et recevez des recommandations personnalisées.',
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
      description:
        "Mesurez l'impact environnemental de votre activité. Quantifiez vos émissions de CO2 (Scope 1, 2 et 3) et identifiez les leviers de décarbonation.",
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
      icon: 'finance',
      title: 'Comparateur de Financements',
      description:
        'Un projet de transition énergétique est avant tout financier. Comparez les modèles de financement pour trouver la solution adaptée à votre trésorerie.',
      features: [
        { bold: 'Comparaison transparente', text: 'de plusieurs modèles.' },
        { bold: 'Simulation des flux', text: 'de trésorerie et rentabilité.' },
        { bold: 'Aide à la décision', text: 'pour sécuriser votre investissement.' },
      ],
      buttonText: 'Comparer les Financements',
      routerLink: '/comparaison-financements',
      accentColor: 'orange',
    },
  ];
}
