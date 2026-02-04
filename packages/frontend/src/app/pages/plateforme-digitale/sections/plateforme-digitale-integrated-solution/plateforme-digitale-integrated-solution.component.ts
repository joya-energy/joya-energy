import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUsers, lucideTarget, lucidePuzzle } from '@ng-icons/lucide';

interface Benefit {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-plateforme-digitale-integrated-solution',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './plateforme-digitale-integrated-solution.component.html',
  styleUrl: './plateforme-digitale-integrated-solution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideUsers, lucideTarget, lucidePuzzle })],
})
export class PlateformeDigitaleIntegratedSolutionComponent {
  protected readonly benefits: Benefit[] = [
    { icon: 'lucideUsers', text: 'Un seul interlocuteur' },
    { icon: 'lucideTarget', text: 'Un pilotage centralisé' },
    { icon: 'lucidePuzzle', text: 'Une solution cohérente de bout en bout' },
  ];
}
