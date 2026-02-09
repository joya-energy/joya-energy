import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLinkedin } from '@ng-icons/lucide';
import { FooterVisibilityService } from '../../services/footer-visibility.service';
import { LeadService } from '../../../core/services/lead.service';
import { finalize } from 'rxjs/operators';

interface NavigationLink {
  name: string;
  href: string;
}

interface NavigationGroup {
  solutions: NavigationLink[];
  support: NavigationLink[];
  company: NavigationLink[];
  legal: NavigationLink[];
  social: Array<NavigationLink & { icon: string }>;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideLinkedin })],
})
export class FooterComponent {
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly leadService = inject(LeadService);

  // Expose visibility signal
  readonly isVisible = this.footerVisibilityService.isVisible;

  protected readonly email = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly submitStatus = signal<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  
  protected readonly navigation: NavigationGroup = {
    solutions: [
      { name: 'Ressources', href: '/ressources' },
      { name: 'Audit Solaire', href: '/audit-solaire' },
      { name: 'Audit Énergétique', href: '/audit-energetique' },

      { name: 'Comparateur de financement', href: '/comparaison-financements' },
      { name: 'Bilan Carbone', href: '/bilan-carbon' },
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
      { name: 'État des services', href: '/status' },
    ],
    company: [
      { name: 'À propos', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Installateurs', href: '/installateurs' },
      { name: 'Partenaires', href: '/devenir-partenaire' },
    ],
    legal: [
      { name: 'Confidentialité', href: '/privacy' },
      { name: 'Politique de données', href: '/data-policy' },
    ],
    social: [
      {
        name: 'LinkedIn',
        href: 'https://www.linkedin.com/company/juya-energy/?viewAsMember=true',
        icon: 'lucideLinkedin',
      },
    ],
  };

  protected readonly currentYear = new Date().getFullYear();

  protected handleSubmit(event: Event): void {
    event.preventDefault();

    const emailValue = this.email().trim();

    if (!emailValue) {
      this.submitStatus.set({
        type: 'error',
        message: 'Veuillez entrer votre email.',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      this.submitStatus.set({
        type: 'error',
        message: 'Veuillez entrer une adresse email valide.',
      });
      return;
    }

    this.isSubmitting.set(true);
    this.submitStatus.set(null);

    this.leadService
      .createLead({
        email: emailValue,
        source: 'newsletter',
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          // Check if email already exists
          if ('message' in response && response.message === 'already exist') {
            this.submitStatus.set({
              type: 'success',
              message: 'Vous êtes déjà inscrit à notre newsletter !',
            });
          } else {
            this.submitStatus.set({
              type: 'success',
              message: 'Merci pour votre inscription ! Vous recevrez bientôt nos actualités.',
            });
          }
          this.email.set('');
        },
        error: (error) => {
          console.error('Newsletter subscription error:', error);
          this.submitStatus.set({
            type: 'error',
            message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
          });
        },
      });
  }
}
