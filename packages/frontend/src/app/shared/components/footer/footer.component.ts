import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLinkedin } from '@ng-icons/lucide';
import { FooterVisibilityService } from '../../services/footer-visibility.service';

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
  providers: [provideIcons({ lucideLinkedin })]
})
export class FooterComponent {
  private readonly footerVisibilityService = inject(FooterVisibilityService);
  
  // Expose visibility signal
  readonly isVisible = this.footerVisibilityService.isVisible;

  protected readonly email = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly submitStatus = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  protected readonly navigation: NavigationGroup = {
    solutions: [
      { name: 'Financement Solaire', href: '/financement' },
      { name: 'Estimation Solaire', href: '/estimation-solaire' },
      { name: 'Audit Énergétique', href: '/audit-energetique' },
    ],
    support: [
      { name: 'FAQ', href: '#' },
      { name: 'Contact', href: '/contact' },
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
        icon: 'lucideLinkedin'
      },
    ],
  };

  protected readonly currentYear = new Date().getFullYear();

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.email()) {
      this.submitStatus.set({ 
        type: 'error', 
        message: 'Veuillez entrer votre email.' 
      });
      return;
    }
    
    this.isSubmitting.set(true);
    this.submitStatus.set(null);
    
    // TODO: Replace with actual API endpoint
    // For now, simulate API call
    setTimeout(() => {
      this.submitStatus.set({ 
        type: 'success', 
        message: 'Merci pour votre inscription !' 
      });
      this.email.set('');
      this.isSubmitting.set(false);
    }, 500);
  }
}
