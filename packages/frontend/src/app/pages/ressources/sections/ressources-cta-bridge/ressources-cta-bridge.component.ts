import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSparkles,
  lucideArrowRight,
  lucideCheck,
  lucideClock,
  lucideShield,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-ressources-cta-bridge',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './ressources-cta-bridge.component.html',
  styleUrl: './ressources-cta-bridge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ lucideSparkles, lucideArrowRight, lucideCheck, lucideClock, lucideShield }),
  ],
})
export class RessourcesCtaBridgeComponent {}
