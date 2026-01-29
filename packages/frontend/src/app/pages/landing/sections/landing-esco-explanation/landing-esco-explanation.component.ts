import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';
import {
  lucideSettings,
  lucideTrendingUp,
  lucideDollarSign,
  lucideCheckCircle,
  lucideArrowRight,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-landing-esco-explanation',
  standalone: true,
  imports: [CommonModule, NgIconComponent, LandingBadgeComponent],
  templateUrl: './landing-esco-explanation.component.html',
  styleUrl: './landing-esco-explanation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideSettings,
      lucideTrendingUp,
      lucideDollarSign,
      lucideCheckCircle,
      lucideArrowRight,
    }),
  ],
})
export class LandingEscoExplanationComponent {}
