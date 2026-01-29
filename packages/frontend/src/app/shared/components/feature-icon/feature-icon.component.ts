import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSun,
  lucideTrendingUp,
  lucideLeaf,
  lucideBarChart3,
  lucideCreditCard
} from '@ng-icons/lucide';

export type FeatureIconName = 'sun' | 'growth' | 'leaf' | 'chart' | 'card';

const ICON_MAP: Record<FeatureIconName, string> = {
  sun: 'lucideSun',
  growth: 'lucideTrendingUp',
  leaf: 'lucideLeaf',
  chart: 'lucideBarChart3',
  card: 'lucideCreditCard'
};

@Component({
  selector: 'app-feature-icon',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './feature-icon.component.html',
  styleUrl: './feature-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ lucideSun, lucideTrendingUp, lucideLeaf, lucideBarChart3, lucideCreditCard })
  ],
  host: {
    class: 'feature-icon',
    '[attr.data-variant]': 'variant()',
    '[attr.data-no-background]': 'noBackground() ? "" : null'
  }
})
export class FeatureIconComponent {
  readonly name = input<FeatureIconName>('sun');
  readonly variant = input<'default' | 'teal' | 'aqua' | 'neutral'>('default');
  readonly noBackground = input<boolean>(false);
  protected readonly iconName = computed(() => ICON_MAP[this.name()]);
  readonly size = input<number>(28);
}

