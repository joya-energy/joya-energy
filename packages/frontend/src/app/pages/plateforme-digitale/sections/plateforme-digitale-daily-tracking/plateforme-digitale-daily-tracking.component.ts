import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideZap, lucideSun, lucideTrendingDown, lucideTrendingUp } from '@ng-icons/lucide';

interface TrackingCard {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-plateforme-digitale-daily-tracking',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './plateforme-digitale-daily-tracking.component.html',
  styleUrl: './plateforme-digitale-daily-tracking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideZap,
      lucideSun,
      lucideTrendingDown,
      lucideTrendingUp,
    }),
  ],
})
export class PlateformeDigitaleDailyTrackingComponent {
  protected readonly cards: TrackingCard[] = [
    {
      icon: 'lucideZap',
      title: 'Consommation énergétique',
      description: 'Suivi de votre consommation réelle, par période, par site et par usage.',
    },
    {
      icon: 'lucideSun',
      title: 'Production solaire',
      description:
        'Visualisation de la production solaire et de son impact sur votre consommation globale.',
    },
    {
      icon: 'lucideTrendingDown',
      title: 'Économies réalisées',
      description: 'Mesure des économies générées, comparées à votre situation de référence.',
    },
    {
      icon: 'lucideTrendingUp',
      title: 'Performance globale',
      description: 'Indicateurs synthétiques pour suivre la performance énergétique dans le temps.',
    },
  ];
}
