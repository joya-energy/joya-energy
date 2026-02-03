import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideAlertTriangle,
  lucideBarChart2,
  lucideSettings,
} from '@ng-icons/lucide';

interface MonitoringFeature {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-plateforme-digitale-continuous-monitoring',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './plateforme-digitale-continuous-monitoring.component.html',
  styleUrl: './plateforme-digitale-continuous-monitoring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideActivity,
      lucideAlertTriangle,
      lucideBarChart2,
      lucideSettings,
    }),
  ],
})
export class PlateformeDigitaleContinuousMonitoringComponent {
  protected readonly features: MonitoringFeature[] = [
    { icon: 'lucideActivity', text: 'Suivi continu de la consommation et de la production' },
    { icon: 'lucideAlertTriangle', text: "Détection d'écarts ou de dérives" },
    { icon: 'lucideBarChart2', text: 'Analyse de la performance dans le temps' },
    { icon: 'lucideSettings', text: 'Ajustements et optimisations si nécessaire' },
  ];
}
