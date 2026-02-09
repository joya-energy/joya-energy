import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RessourcesPageHeaderComponent } from './sections/ressources-page-header/ressources-page-header.component';
import { RessourcesWhySectionComponent } from './sections/ressources-why-section/ressources-why-section.component';
import { RessourcesSimulatorsSectionComponent } from './sections/ressources-simulators-section/ressources-simulators-section.component';
import { RessourcesCtaBridgeComponent } from './sections/ressources-cta-bridge/ressources-cta-bridge.component';

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
export class RessourcesComponent {}
