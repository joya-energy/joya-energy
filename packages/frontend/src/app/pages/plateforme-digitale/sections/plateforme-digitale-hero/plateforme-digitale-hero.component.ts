import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideZap, lucideArrowRight, lucideBarChart2, lucideTrendingUp } from '@ng-icons/lucide';

@Component({
  selector: 'app-plateforme-digitale-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './plateforme-digitale-hero.component.html',
  styleUrl: './plateforme-digitale-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideZap, lucideArrowRight, lucideBarChart2, lucideTrendingUp })],
})
export class PlateformeDigitaleHeroComponent {}
