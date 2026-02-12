import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RessourcesPageHeaderComponent } from './sections/ressources-page-header/ressources-page-header.component';
import { RessourcesWhySectionComponent } from './sections/ressources-why-section/ressources-why-section.component';
import { RessourcesSimulatorsSectionComponent } from './sections/ressources-simulators-section/ressources-simulators-section.component';
import { RessourcesCtaBridgeComponent } from './sections/ressources-cta-bridge/ressources-cta-bridge.component';
import { SEOService } from '../../core/services/seo.service';

@Component({
  selector: 'app-ressources',
  standalone: true,
  imports: [
    CommonModule,
    RessourcesPageHeaderComponent,
    RessourcesWhySectionComponent,
    RessourcesSimulatorsSectionComponent,
    RessourcesCtaBridgeComponent,
  ],
  templateUrl: './ressources.component.html',
  styleUrl: './ressources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RessourcesComponent implements OnInit {
  private seoService = inject(SEOService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Ressources | JOYA Energy',
      description: 'Accédez à nos outils, simulateurs et ressources pour mieux comprendre l\'énergie solaire en Tunisie et optimiser votre transition énergétique.',
      url: 'https://joya-energy.com/ressources',
      keywords: 'ressources énergétiques Tunisie, simulateur solaire Tunisie, outils énergie Tunisie, guides énergie solaire Tunisie, Tunisia',
    });
  }
}
