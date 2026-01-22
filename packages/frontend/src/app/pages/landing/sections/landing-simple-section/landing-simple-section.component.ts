import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';

@Component({
  selector: 'app-landing-simple-section',
  standalone: true,
  imports: [CommonModule, LandingBadgeComponent],
  templateUrl: './landing-simple-section.component.html',
  styleUrl: './landing-simple-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingSimpleSectionComponent {
  public id = input<string | null>(null);
  public badge = input<string | null>(null);
  public title = input.required<string>();
  public subtitle = input<string | null>(null);
  public variant = input<'light' | 'white'>('light');
}

