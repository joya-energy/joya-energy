import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheckCircle } from '@ng-icons/lucide';

@Component({
  selector: 'app-plateforme-digitale-useful-indicators',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './plateforme-digitale-useful-indicators.component.html',
  styleUrl: './plateforme-digitale-useful-indicators.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideCheckCircle })],
})
export class PlateformeDigitaleUsefulIndicatorsComponent {
  protected readonly benefits = [
    'Comprendre ce qui se passe',
    "Suivre l'évolution dans le temps",
    "Mesurer l'impact réel de la solution",
  ];
}
