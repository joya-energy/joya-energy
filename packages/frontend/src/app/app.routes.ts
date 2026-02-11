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
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
    title: 'Landing | JOYA Energy',
    data: { hideFooter: false },
  },
  {
    path: 'notre-solution',
    loadComponent: () =>
      import('./pages/notre-solution/notre-solution.component').then(
        (m) => m.NotreSolutionComponent
      ),
    title: 'Notre solution | JOYA Energy',
  },
  {
    path: 'plateforme-digitale',
    loadComponent: () =>
      import('./pages/plateforme-digitale/plateforme-digitale.component').then(
        (m) => m.PlateformeDigitaleComponent
      ),
    title: 'Plateforme digitale | JOYA Energy',
  },
  {
    path: 'ressources',
    loadComponent: () =>
      import('./pages/ressources/ressources.component').then((m) => m.RessourcesComponent),
    title: 'Ressources | JOYA Energy',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contactez-nous | JOYA Energy',
  },
  {
    path: 'audit-solaire',
    loadComponent: () =>
      import('./pages/solar-audit/solar-audit.component').then((m) => m.SolarAuditComponent),
    title: 'Audit Solaire | JOYA Energy',
    data: { hideFooter: true },
  },
  {
    path: 'comparaison-financements',
    loadComponent: () =>
      import('./pages/comparaison-financements/comparaison-financements.component').then(
        (m) => m.ComparaisonFinancementsComponent
      ),
    title: 'Comparateur de Financements | JOYA Energy',
    data: { hideFooter: true },
  },
  {
    path: 'bilan-carbon',
    loadComponent: () =>
      import('./pages/bilan-carbon/bilan-carbon.component').then((m) => m.BilanCarbonComponent),
    title: 'Bilan Carbone | JOYA Energy',
    data: { hideFooter: true },
  },
  {
    path: 'audit-energetique',
    loadComponent: () =>
      import('./pages/energy-audit/energy-audit.component').then((m) => m.EnergyAuditComponent),
    title: 'Audit Énergétique | JOYA Energy',
    data: { hideFooter: true },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/confidentialite/confidentialite.component').then(
        (m) => m.ConfidentialiteComponent
      ),
    title: 'Confidentialité | JOYA Energy',
  },
  {
    path: 'data-policy',
    loadComponent: () =>
      import('./pages/politique-donnees/politique-donnees.component').then(
        (m) => m.PolitiqueDonneesComponent
      ),
    title: 'Politique de données | JOYA Energy',
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faq/faq.component').then((m) => m.FaqComponent),
    title: 'FAQ | JOYA Energy',
  },
  {
    path: 'status',
    loadComponent: () => import('./pages/status/status.component').then((m) => m.StatusComponent),
    title: 'État des services | JOYA Energy',
  },
  {
    path: 'prendre-rendez-vous',
    loadComponent: () =>
      import('./pages/prendre-rendez-vous/prendre-rendez-vous.component').then(
        (m) => m.PrendreRendezVousComponent
      ),
    title: 'Prendre rendez-vous | JOYA Energy',
  },
  {
    path: 'admin-joya-2026/leads/login',
    loadComponent: () =>
      import('./pages/lead-monitoring/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
    title: 'Connexion Admin | JOYA Energy',
    data: { hideFooter: true },
  },
  {
    path: 'admin-joya-2026/leads',
    loadComponent: () =>
      import('./pages/lead-monitoring/lead-monitoring.component').then(
        (m) => m.LeadMonitoringComponent
      ),
    title: 'Leads | JOYA Energy',
    data: { hideFooter: true },
    canActivate: [
      () => import('./core/guards/admin-auth.guard').then((m) => m.adminAuthGuard),
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
