import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSparkles, lucideArrowRight } from '@ng-icons/lucide';

@Component({
  selector: 'app-plateforme-digitale-final-cta',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './plateforme-digitale-final-cta.component.html',
  styleUrl: './plateforme-digitale-final-cta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideSparkles, lucideArrowRight })],
})
export class PlateformeDigitaleFinalCtaComponent {}
