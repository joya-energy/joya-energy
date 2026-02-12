import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';

@Component({
  selector: 'app-confidentialite',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confidentialite.component.html',
  styleUrl: './confidentialite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidentialiteComponent implements OnInit {
  private readonly seoService = inject(SEOService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Confidentialité | JOYA Energy',
      description: 'Politique de confidentialité de JOYA Energy. Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée en Tunisie.',
      url: 'https://joya-energy.com/privacy',
      keywords: 'confidentialité JOYA Energy, protection données personnelles Tunisie, politique confidentialité',
    });
  }
  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
