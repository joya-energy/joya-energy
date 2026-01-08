import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  protected readonly cards = signal<SimulatorCard[]>([
    {
      title: 'Audit énergétique',
      description: 'Analysez votre consommation et identifiez vos économies potentielles.',
      cta: 'Lancer le simulateur',
      href: 'audit-energetique',
      icon: 'chart',
      iconVariant: 'neutral',
      label: 'Diagnostic',
      route: 'audit-energetique'
    },
    {
      title: 'Simulation photovoltaïque',
      description: 'Estimez la production solaire adaptée à votre bâtiment.',
      cta: 'Lancer le simulateur',
      href: 'audit-solaire',
      icon: 'sun',
      iconVariant: 'default',
      label: 'Populaire',
      featured: true,
      route: 'audit-solaire'
    },
    {
      title: 'Comparateur de financement',
      description: 'Comparez le modèle ESCO avec le crédit classique.',
      cta: 'Lancer le simulateur',
      href: '/simulaturs/financement',
      icon: 'card',
      iconVariant: 'aqua',
      label: 'ESCO vs Crédit',
      route: 'audit-financement'
    }
  ]);

  protected navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}

