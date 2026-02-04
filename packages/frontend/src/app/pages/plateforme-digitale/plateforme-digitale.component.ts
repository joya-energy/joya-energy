import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlateformeDigitaleHeroComponent } from './sections/plateforme-digitale-hero/plateforme-digitale-hero.component';
import { PlateformeDigitaleIntroComponent } from './sections/plateforme-digitale-intro/plateforme-digitale-intro.component';
import { PlateformeDigitaleDailyTrackingComponent } from './sections/plateforme-digitale-daily-tracking/plateforme-digitale-daily-tracking.component';
import { PlateformeDigitaleUsefulIndicatorsComponent } from './sections/plateforme-digitale-useful-indicators/plateforme-digitale-useful-indicators.component';
import { PlateformeDigitaleContinuousMonitoringComponent } from './sections/plateforme-digitale-continuous-monitoring/plateforme-digitale-continuous-monitoring.component';
import { PlateformeDigitaleTransparencyComponent } from './sections/plateforme-digitale-transparency/plateforme-digitale-transparency.component';
import { PlateformeDigitaleIntegratedSolutionComponent } from './sections/plateforme-digitale-integrated-solution/plateforme-digitale-integrated-solution.component';
import { PlateformeDigitaleFinalCtaComponent } from './sections/plateforme-digitale-final-cta/plateforme-digitale-final-cta.component';

@Component({
  selector: 'app-plateforme-digitale',
  standalone: true,
  imports: [
    CommonModule,
    PlateformeDigitaleHeroComponent,
    PlateformeDigitaleIntroComponent,
    PlateformeDigitaleDailyTrackingComponent,
    PlateformeDigitaleUsefulIndicatorsComponent,
    PlateformeDigitaleContinuousMonitoringComponent,
    PlateformeDigitaleTransparencyComponent,
    PlateformeDigitaleIntegratedSolutionComponent,
    PlateformeDigitaleFinalCtaComponent,
  ],
  templateUrl: './plateforme-digitale.component.html',
  styleUrl: './plateforme-digitale.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlateformeDigitaleComponent {}
