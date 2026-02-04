import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import {
  PerformanceIconsComponent,
  type RessourcesIconName,
} from '../performance-icons/performance-icons.component';

@Component({
  selector: 'app-knowledge-card',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent, PerformanceIconsComponent],
  templateUrl: './knowledge-card.component.html',
  styleUrl: './knowledge-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideArrowRight })],
  host: {
    class: 'knowledge-card-host',
  },
})
export class KnowledgeCardComponent {
  readonly icon = input.required<RessourcesIconName>();
  readonly badge = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly linkText = input.required<string>();
  readonly routerLink = input<string>('/');
}
