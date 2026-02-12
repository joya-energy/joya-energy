import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';

@Component({
  selector: 'app-politique-donnees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './politique-donnees.component.html',
  styleUrl: './politique-donnees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolitiqueDonneesComponent implements OnInit {
  private readonly seoService = inject(SEOService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Politique de données | JOYA Energy',
      description: 'Politique de traitement des données de JOYA Energy. Informations sur la collecte, l\'utilisation et la protection de vos données en Tunisie.',
      url: 'https://joya-energy.com/data-policy',
      keywords: 'politique données JOYA Energy, traitement données personnelles Tunisie, protection données',
    });
  }
  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
