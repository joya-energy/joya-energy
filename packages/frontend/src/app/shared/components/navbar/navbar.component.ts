import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../logo/logo.component';

interface NavLink {
  label: string;
  path: string;
  id: string;
}

enum menuItems {
  SIMULATEURS = 'Simulateurs',
  MODELE_ESCO = 'Modèle ESCO',
  COMMENT_CA_MARCHE = 'Comment ça marche',
  CONTACT = 'Contact',
  ESTIMATION_GRATUITE = 'Estimation gratuite'
}
@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive, LogoComponent],
  host: {
    class: 'navbar-wrapper'
  }
})
export class NavbarComponent {
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly menuItems = menuItems;

  // Navigation links
  protected readonly navLinks: NavLink[] = [
    { label: menuItems.SIMULATEURS, path: '/simulateurs', id: 'nav-simulateurs' },
    { label: menuItems.MODELE_ESCO, path: '/modele-esco', id: 'nav-modele' },
    { label: menuItems.COMMENT_CA_MARCHE, path: '/comment-ca-marche', id: 'nav-comment' },
    {label: menuItems.CONTACT, path: '/contact', id: 'nav-contact' },
  ];

  // Actions
  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
