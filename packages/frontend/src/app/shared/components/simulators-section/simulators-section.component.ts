import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { FeatureIconComponent, FeatureIconName } from '../feature-icon/feature-icon.component';

interface SimulatorCard {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: FeatureIconName;
  iconVariant: 'default' | 'teal' | 'aqua' | 'neutral';
  label?: string;
  featured?: boolean;
  route?: string;
}

@Component({
  selector: 'app-simulators-section',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconComponent, FeatureIconComponent],
  templateUrl: './simulators-section.component.html',
  styleUrl: './simulators-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideArrowRight })]
})
export class SimulatorsSectionComponent {
  protected readonly cards = signal<SimulatorCard[]>([
    {
      title: 'Audit énergétique',
      description: 'Analysez votre consommation et identifiez vos économies potentielles.',
      cta: 'Lancer le simulateur',
      href: '/simulateurs/audit-energetique',
      icon: 'chart',
      iconVariant: 'neutral',
      label: 'Diagnostic',
      route: '/audit-energetique'
    },
    {
      title: 'Simulation photovoltaïque',
      description: 'Estimez la production solaire adaptée à votre bâtiment.',
      cta: 'Lancer le simulateur',
      href: '/simulateurs/photovoltaique',
      icon: 'sun',
      iconVariant: 'default',
      label: 'Populaire',
      featured: true
    },
    {
      title: 'Comparateur de financement',
      description: 'Comparez le modèle ESCO avec le crédit classique.',
      cta: 'Lancer le simulateur',
      href: '/simulateurs/financement',
      icon: 'card',
      iconVariant: 'aqua',
      label: 'ESCO vs Crédit'
    }
  ]);
}

