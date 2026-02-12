import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FAQ_ITEMS } from '../../shared/data/faq.data';
import { SEOService } from '../../core/services/seo.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent implements OnInit {
  private readonly seoService = inject(SEOService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'FAQ | JOYA Energy',
      description: 'Trouvez les réponses aux questions fréquentes sur l\'énergie solaire en Tunisie, le financement ESCO, les panneaux photovoltaïques et la transition énergétique pour les entreprises.',
      url: 'https://joya-energy.com/faq',
      keywords: 'FAQ énergie solaire Tunisie, questions panneaux solaires, financement ESCO Tunisie, énergie solaire entreprise Tunisie',
    });
  }
  protected readonly faqItems = FAQ_ITEMS;

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
