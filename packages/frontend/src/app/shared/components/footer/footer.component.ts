import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FooterVisibilityService } from '../../services/footer-visibility.service';
import { LeadService } from '../../../core/services/lead.service';
import { finalize } from 'rxjs/operators';

interface FooterLink {
  name: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  private readonly leadService = inject(LeadService);

  readonly isVisible = this.footerVisibilityService.isVisible;

  protected readonly email = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly submitStatus = signal<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  protected readonly navLinks: FooterLink[] = [
    { name: 'Solution', href: '/notre-solution' },
    { name: 'Secteurs', href: '/secteurs' },
    { name: 'Partenaires', href: '/installateur-partenaire' },
    { name: 'Ressources', href: '/ressources' },
  ];

  protected readonly social: FooterLink[] = [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/juya-energy/?viewAsMember=true',
    },
  ];

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
          if ('message' in response && response.message === 'already exist') {
            this.submitStatus.set({
              type: 'success',
              message: 'Vous êtes déjà inscrit à notre newsletter !',
            });
          } else {
            this.submitStatus.set({
              type: 'success',
              message: 'Merci pour votre inscription !',
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
