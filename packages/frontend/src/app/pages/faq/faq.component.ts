import { Component, ChangeDetectionStrategy, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FAQ_ITEMS } from '../../shared/data/faq.data';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent implements OnInit, AfterViewInit {
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'FAQ | JOYA Energy',
      description:
        "Trouvez les réponses aux questions fréquentes sur l'énergie solaire en Tunisie, les panneaux photovoltaïques et la transition énergétique pour les entreprises.",
      url: 'https://joya-energy.com/faq',
      keywords:
        'FAQ énergie solaire Tunisie, questions panneaux solaires, énergie solaire entreprise Tunisie',
    });
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }

  protected readonly faqItems = FAQ_ITEMS;

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
