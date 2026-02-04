import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideCheck } from '@ng-icons/lucide';
import {
  PerformanceIconsComponent,
  type RessourcesIconName,
} from '../performance-icons/performance-icons.component';

export type SimulatorAccentColor = 'orange' | 'teal';

@Component({
  selector: 'app-simulator-card',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent, PerformanceIconsComponent],
  templateUrl: './simulator-card.component.html',
  styleUrl: './simulator-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideArrowRight, lucideCheck })],
  host: {
    class: 'simulator-card-host',
  },
})
export class SimulatorCardComponent {
  readonly icon = input.required<RessourcesIconName>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly features = input.required<{ bold: string; text: string }[]>();
  readonly buttonText = input.required<string>();
  readonly routerLink = input.required<string>();
  readonly accentColor = input<SimulatorAccentColor>('orange');
  readonly isFirst = input<boolean>(false);
}
