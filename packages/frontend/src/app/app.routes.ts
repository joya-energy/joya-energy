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
    path: 'audit-solaire',
    loadComponent: () => import('./pages/audit-solaire/audit-solaire.component').then(m => m.AuditSolaireComponent),
    title: 'Simulation audit solaire | JOYA Energy'
  },
  {
    path: 'comparaison-financements',
    loadComponent: () => import('./features/financing-comparison/financing-comparison.component').then(m => m.FinancingComparisonComponent),
    title: 'Comparateur de Financements | JOYA Energy'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
