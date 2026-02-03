import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideMonitor, lucideTrendingUp, lucideShield } from '@ng-icons/lucide';

@Component({
  selector: 'app-plateforme-digitale-intro',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './plateforme-digitale-intro.component.html',
  styleUrl: './plateforme-digitale-intro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideMonitor, lucideTrendingUp, lucideShield })],
})
export class PlateformeDigitaleIntroComponent {}
