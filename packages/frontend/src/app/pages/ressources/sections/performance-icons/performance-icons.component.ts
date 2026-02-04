import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RessourcesIconName =
  | 'clarify'
  | 'savings'
  | 'plan'
  | 'solar'
  | 'energy-audit'
  | 'carbon'
  | 'finance'
  | 'guide'
  | 'case-study'
  | 'faq';

@Component({
  selector: 'app-ressources-performance-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-icons.component.html',
  styleUrl: './performance-icons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceIconsComponent {
  readonly name = input.required<RessourcesIconName>();
  readonly class = input<string>('');
}
