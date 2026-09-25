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
      description:
        'Suivez votre consommation réelle par période, par site et par usage lorsque ces données sont disponibles.',
    },
    {
      icon: 'lucideSun',
      title: 'Production solaire',
      description:
        'Suivez le rendement continu de vos panneaux photovoltaïques et comparez-le aux prévisions.',
    },
    {
      icon: 'lucideTrendingDown',
      title: 'Économies réalisées',
      description:
        'Visualisez les gains financiers générés et constatez la réduction directe de votre facture STEG.',
    },
    {
      icon: 'lucideTrendingUp',
      title: 'Performance globale',
      description:
        "Suivez l'évolution des principaux indicateurs énergétiques dans le temps.",
    },
  ];
}
