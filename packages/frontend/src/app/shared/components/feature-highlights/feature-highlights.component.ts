import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureIconComponent, FeatureIconName } from '../feature-icon/feature-icon.component';

type FeatureIcon = 'sun' | 'growth' | 'leaf';

interface FeatureHighlight {
  title: string;
  description: string;
  icon: FeatureIconName;
}

@Component({
  selector: 'app-feature-highlights',
  standalone: true,
  imports: [CommonModule, FeatureIconComponent],
  templateUrl: './feature-highlights.component.html',
  styleUrl: './feature-highlights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureHighlightsComponent {
  protected readonly features: FeatureHighlight[] = [
    {
      title: '0 investissement initial',
      description: 'Installation photovoltaïque sans débourser un centime',
      icon: 'sun'
    },
    {
      title: 'Économies garanties',
      description: 'Réduction immédiate de votre facture énergétique',
      icon: 'growth'
    },
    {
      title: 'Installation & maintenance incluses',
      description: 'Service clé en main avec suivi et maintenance',
      icon: 'leaf'
    }
  ];
}

