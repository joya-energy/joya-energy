import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLinkedin } from '@ng-icons/lucide';

interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string; }>;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideLinkedin })]
})
export class FooterComponent {
  protected readonly companyDescription = 'Solutions énergétiques clés en main pour les entreprises, avec un pilotage de la performance dans le temps.';
  protected readonly newsletterTitle = 'Restez informé';
  protected readonly newsletterDescription = 'Recevez nos actualités, conseils sur la performance énergétique et outils pour optimiser la consommation de votre entreprise.';
  protected readonly newsletterPlaceholder = 'Votre email professionnel';
  protected readonly newsletterButton = 'S\'inscrire';
  protected readonly newsletterDisclaimer = 'Nous respectons votre vie privée. Désinscription possible à tout moment.';
  protected readonly copyright = '© 2026 Joya. Tous droits réservés.';
  
  protected readonly email = signal('');
  
  protected readonly footerColumns: FooterColumn[] = [
    {
      title: 'Solution',
      links: [
        { label: 'Notre solution', href: '/notre-solution' },
        { label: 'Notre approche', href: '/notre-approche' },
        { label: 'Plateforme digitale', href: '/plateforme-digitale' },
        { label: 'Étude énergétique', href: '/audit-solaire' },
        { label: 'Simulateurs', href: '/audit-solaire' }
      ]
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Ressources', href: '/ressources' },
        { label: 'Simulateur solaire', href: '/audit-solaire' },
        { label: 'Guides & articles', href: '/ressources' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Glossaire', href: '/glossaire' }
      ]
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '/a-propos' },
        { label: 'Blog', href: '/blog' },
        { label: 'Partenaires', href: '/partenaires' },
        { label: 'Contact', href: '/contact' }
      ]
    },
    {
      title: 'Mentions légales',
      links: [
        { label: 'Mentions légales', href: '/mentions-legales' },
        { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
        { label: 'Politique de données', href: '/politique-donnees' }
      ]
    }
  ];
  
  protected subscribeNewsletter(): void {
    // Implement newsletter subscription logic
    console.log('Subscribe:', this.email());
  }
}


