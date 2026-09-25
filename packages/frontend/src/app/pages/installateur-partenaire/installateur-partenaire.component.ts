import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';
import { environment } from '../../../environments/environment';

interface PartnerStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-installateur-partenaire',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './installateur-partenaire.component.html',
  styleUrl: './installateur-partenaire.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallateurPartenaireComponent implements OnInit, AfterViewInit {
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);

  /** Installer registration form in the Joya customer app. */
  protected readonly devenirPartenaireUrl = `${environment.customerAppUrl.replace(/\/$/, '')}/installateurs`;

  protected readonly steps: PartnerStep[] = [
    {
      number: '01',
      title: 'Candidature',
      description: 'Présentez votre entreprise et vos références.',
    },
    {
      number: '02',
      title: 'Validation',
      description: 'Nous vérifions vos qualifications techniques, vous recevez vos accès.',
    },
    {
      number: '03',
      title: 'Projets partagés',
      description:
        'Vous recevez des dossiers qualifiés et/ou soumettez les vôtres via votre espace.',
    },
    {
      number: '04',
      title: 'Suivi continu',
      description: 'Suivi des dossiers et de la performance, pilotés ensemble sur la plateforme.',
    },
  ];

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Partenaires — Joya Energy',
      description:
        "Installateurs, bureaux d'études, apporteurs d'affaires : rejoignez le réseau Joya et déployez plus de projets solaires en Tunisie.",
      url: 'https://joya-energy.com/installateur-partenaire',
      keywords:
        'partenaires Joya, installateur solaire Tunisie, réseau partenaires, bureaux d\'études solaire',
    });
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }
}
