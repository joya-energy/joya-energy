import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeroComponent } from '../../shared/components/hero/hero.component';
import { FeatureHighlightsComponent } from '../../shared/components/feature-highlights/feature-highlights.component';
import { SimulatorsSectionComponent } from '../../shared/components/simulators-section/simulators-section.component';
import { FaqSectionComponent } from '../../shared/components/faq-section/faq-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    FeatureHighlightsComponent,
    SimulatorsSectionComponent,
    FaqSectionComponent
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}

