import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavLink {
  label: string;
  path: string;
  id: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'navbar-wrapper'
  }
})
export class NavbarComponent {
  // State: Mobile menu toggle
  protected readonly isMobileMenuOpen = signal(false);

  // Navigation links
  protected readonly navLinks: NavLink[] = [
    { label: 'Simulateurs', path: '/simulateurs', id: 'nav-simulateurs' },
    { label: 'Modèle ESCO', path: '/modele-esco', id: 'nav-modele' },
    { label: 'Comment ça marche', path: '/comment-ca-marche', id: 'nav-comment' },
    { label: 'Témoignages', path: '/temoignages', id: 'nav-temoignages' }
  ];

  // Actions
  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}

