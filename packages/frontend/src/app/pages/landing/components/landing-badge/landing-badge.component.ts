import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-landing-badge',
  standalone: true,
  template: `
    <span class="landing-badge" [class.landing-badge--secondary]="variant() === 'secondary'">
      {{ text() }}
    </span>
  `,
  styleUrl: './landing-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBadgeComponent {
  public text = input.required<string>();
  public variant = input<'primary' | 'secondary'>('primary');
}
