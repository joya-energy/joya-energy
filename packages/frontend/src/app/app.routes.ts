import { Routes } from '@angular/router';

/**
 * to hide a footer on a specific page, add the following data to the route:
 * ```typescript
 * {
 *   path: 'special-page',
 *   loadComponent: () => import('./pages/special/special.component').then(m => m.SpecialComponent),
 *   data: { hideFooter: true }
 * }
 * ```
*/


export const routes: Routes = [
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
    title: 'Landing | JOYA Energy',
    data: { hideFooter: false }
  },
  {
    path: 'notre-solution',
    loadComponent: () => import('./pages/notre-solution/notre-solution.component').then(m => m.NotreSolutionComponent),
    title: 'Notre solution | JOYA Energy'
  },
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
    path: 'solar-audit',
    loadComponent: () => import('./pages/solar-audit/solar-audit.component').then(m => m.SolarAuditComponent),
    title: 'Audit Solaire | JOYA Energy',
    data: { hideFooter: true }
  },
  {
    path: 'comparaison-financements',
    loadComponent: () => import('./pages/comparaison-financements/comparaison-financements.component').then(m => m.ComparaisonFinancementsComponent),
    title: 'Comparateur de Financements | JOYA Energy',
    data: { hideFooter: true }
  },
  {
    path: 'bilan-carbon',
    loadComponent: () => import('./pages/bilan-carbon/bilan-carbon.component.js').then(m => m.BilanCarbonComponent),
    title: 'Bilan Carbone | JOYA Energy'
  },
  {
    path: 'energy-audit',
    loadComponent: () => import('./pages/energy-audit/energy-audit.component').then(m => m.EnergyAuditComponent),
    title: 'Audit Énergétique | JOYA Energy',
    data: { hideFooter: true }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
