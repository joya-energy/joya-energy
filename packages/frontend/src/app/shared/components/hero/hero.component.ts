import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hero-wrapper'
  },
  providers: [provideIcons({ lucideArrowRight })]
})
export class HeroComponent {
  protected readonly heading = `Passez au solaire.`;
  protected readonly headingLine2 = `Sans investissement`;
  protected readonly subheading = `Le financement solaire intelligent pour les PME tunisiennes`;
  protected readonly primaryCtaLabel =  `Estimation gratuite`;
  protected readonly secondaryCtaLabel =  `Découvrir notre modèle ESCO`;
  protected readonly heroLines = computed(() => this.heading.split('\n'));
}

