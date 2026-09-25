import { Component, ChangeDetectionStrategy, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';

@Component({
  selector: 'app-politique-donnees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './politique-donnees.component.html',
  styleUrl: './politique-donnees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolitiqueDonneesComponent implements OnInit, AfterViewInit {
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Politique de données | JOYA Energy',
      description:
        "Politique de traitement des données de JOYA Energy. Informations sur la collecte, l'utilisation et la protection de vos données en Tunisie.",
      url: 'https://joya-energy.com/data-policy',
      keywords:
        'politique données JOYA Energy, traitement données personnelles Tunisie, protection données',
    });
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
