import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'JOYA Energy - Passez au solaire'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contactez-nous | JOYA Energy'
  },
  {
    path: 'audit-energetique',
    loadComponent: () => import('./pages/audit-energetique/audit-energetique.component').then(m => m.AuditEnergetiqueComponent),
    title: 'Simulation audit énergétique | JOYA Energy'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
