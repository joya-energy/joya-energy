import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
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
export class LandingComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const pageTitle = 'Passez au solaire sans investissement initial avec JOYA Energy';
    const pageDescription = 'Passez au solaire sans investissement initial avec JOYA Energy en Tunisie : vous payez uniquement vos économies énergétiques réalisées. Transition énergétique simplifiée pour votre entreprise.';
    const logoImage = 'https://joya-energy.com/logo_big.webp';

    this.title.setTitle(pageTitle);
    
    // Update or add meta description
    this.meta.updateTag({ name: 'description', content: pageDescription });
    
    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:url', content: 'https://joya-energy.com/' });
    this.meta.updateTag({ property: 'og:image', content: logoImage });
    this.meta.updateTag({ property: 'og:image:alt', content: 'JOYA Energy - Énergie solaire en Tunisie' });
    
    // Twitter Card tags
    this.meta.updateTag({ property: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ property: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ property: 'twitter:image', content: logoImage });
    this.meta.updateTag({ property: 'twitter:image:alt', content: 'JOYA Energy - Énergie solaire en Tunisie' });

    // Add structured data (JSON-LD) for better Google search results and sitelinks
    this.addStructuredData();
  }

  private addStructuredData(): void {
    const baseUrl = 'https://joya-energy.com';
    
    // Organization structured data
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'JOYA Energy',
      url: baseUrl,
      logo: `${baseUrl}/logo_small.webp`,
      description: 'JOYA Energy accompagne les entreprises dans leur transition énergétique solaire sans investissement initial.',
      sameAs: [
        // Add your social media links here if you have them
      ],
    };

    // Website structured data
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'JOYA Energy',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    // BreadcrumbList for sitelinks
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Accueil',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Notre solution',
          item: `${baseUrl}/notre-solution`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Audit énergétique',
          item: `${baseUrl}/audit-energetique`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Plateforme digitale',
          item: `${baseUrl}/plateforme-digitale`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: 'Ressources',
          item: `${baseUrl}/ressources`,
        },
        {
          '@type': 'ListItem',
          position: 6,
          name: 'Contact',
          item: `${baseUrl}/contact`,
        },
      ],
    };

    // Create and append script tags
    const scripts = [
      { id: 'organization-schema', data: organizationSchema },
      { id: 'website-schema', data: websiteSchema },
      { id: 'breadcrumb-schema', data: breadcrumbSchema },
    ];

    scripts.forEach(({ id, data }) => {
      // Remove existing script if present
      const existingScript = this.document.getElementById(id);
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script tag
      const script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      this.document.head.appendChild(script);
    });
  }
}
