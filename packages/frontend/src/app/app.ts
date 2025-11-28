import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { HeroComponent } from './shared/components/hero/hero.component';
import { FeatureHighlightsComponent } from './shared/components/feature-highlights/feature-highlights.component';
import { SimulatorsSectionComponent } from './shared/components/simulators-section/simulators-section.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    HeroComponent,
    FeatureHighlightsComponent,
    SimulatorsSectionComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('joya-frontend');
}
