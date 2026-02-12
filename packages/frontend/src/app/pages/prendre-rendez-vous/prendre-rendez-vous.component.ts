import { Component, ChangeDetectionStrategy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';

const CALENDLY_SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';

@Component({
  selector: 'app-prendre-rendez-vous',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './prendre-rendez-vous.component.html',
  styleUrl: './prendre-rendez-vous.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrendreRendezVousComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seoService = inject(SEOService);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Prendre rendez-vous | JOYA Energy',
      description: 'Planifiez un rendez-vous avec nos experts en énergie solaire en Tunisie. Discutez de votre projet et obtenez un accompagnement personnalisé pour votre transition énergétique.',
      url: 'https://joya-energy.com/prendre-rendez-vous',
      keywords: 'rendez-vous énergie solaire Tunisie, conseil solaire Tunisie, expert énergie solaire, consultation solaire Tunisie',
    });
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Avoid loading the Calendly script multiple times
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_SCRIPT_SRC}"]`
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = CALENDLY_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }
}
