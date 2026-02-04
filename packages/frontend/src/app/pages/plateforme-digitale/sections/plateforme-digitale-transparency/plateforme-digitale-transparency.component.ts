import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideFileText, lucideLock } from '@ng-icons/lucide';

interface TransparencyPoint {
  icon: string;
  label: string;
  description: string;
  value: string;
}

@Component({
  selector: 'app-plateforme-digitale-transparency',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './plateforme-digitale-transparency.component.html',
  styleUrl: './plateforme-digitale-transparency.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideEye, lucideFileText, lucideLock })],
})
export class PlateformeDigitaleTransparencyComponent {
  protected readonly points: TransparencyPoint[] = [
    {
      icon: 'lucideEye',
      label: 'Ce qui est produit',
      description: 'Suivez votre production solaire en temps réel',
      value: '2.4 kWh',
    },
    {
      icon: 'lucideFileText',
      label: 'Ce qui est consommé',
      description: 'Analysez votre consommation par période',
      value: '1.8 kWh',
    },
    {
      icon: 'lucideLock',
      label: 'Ce qui est économisé',
      description: 'Mesurez vos économies réalisées',
      value: '340',
    },
  ];
}
