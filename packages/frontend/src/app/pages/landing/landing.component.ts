import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingHeroComponent } from './sections/landing-hero/landing-hero.component';
import { LandingJoyaPresentationComponent } from './sections/landing-joya-presentation/landing-joya-presentation.component';
import { LandingEscoExplanationComponent } from './sections/landing-esco-explanation/landing-esco-explanation.component';
import { LandingHowItWorksComponent } from './sections/landing-how-it-works/landing-how-it-works.component';
import { LandingFaqComponent } from './sections/landing-faq/landing-faq.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    LandingHeroComponent,
    LandingJoyaPresentationComponent,
    LandingEscoExplanationComponent,
    LandingHowItWorksComponent,
    LandingFaqComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {}
