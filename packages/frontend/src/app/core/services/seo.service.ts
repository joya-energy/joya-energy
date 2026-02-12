import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SEOData {
  title: string;
  description: string;
  url?: string;
  keywords?: string;
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SEOService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);
  private readonly baseUrl = 'https://joya-energy.com';

  /**
   * Set SEO meta tags for a page
   */
  setSEO(data: SEOData): void {
    const url = data.url || this.baseUrl;

    // Set page title
    this.title.setTitle(data.title);

    // Meta description
    this.meta.updateTag({ name: 'description', content: data.description });

    // Keywords (if provided)
    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Canonical URL - handle link tag manually
    let canonicalLink = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.setAttribute('href', url);
    } else {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', url);
      this.document.head.appendChild(canonicalLink);
    }

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'JOYA Energy' });

    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
    }

    // Twitter Card tags
    this.meta.updateTag({ property: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ property: 'twitter:title', content: data.title });
    this.meta.updateTag({ property: 'twitter:description', content: data.description });
    this.meta.updateTag({ property: 'twitter:url', content: url });

    if (data.image) {
      this.meta.updateTag({ property: 'twitter:image', content: data.image });
    }
  }
}
