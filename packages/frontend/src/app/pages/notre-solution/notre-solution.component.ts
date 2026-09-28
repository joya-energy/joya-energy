import { Component, ChangeDetectionStrategy, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';

interface FaqItem {
  question: string;
  answer: string;
  open?: boolean;
}

@Component({
  selector: 'app-notre-solution',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notre-solution.component.html',
  styleUrl: './notre-solution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotreSolutionComponent implements OnInit, AfterViewInit {
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);

  protected readonly faqs: FaqItem[] = [
    {
      question: 'Comment fonctionne la solution Joya\u00a0?',
      answer:
        "Joya prend en charge 100\u00a0% de l'installation solaire sur votre bâtiment professionnel. Vous ne payez qu'une redevance mensuelle, calculée sur vos économies réelles — toujours inférieure à votre facture actuelle.",
      open: true,
    },
    {
      question: 'À quelles entreprises s\'adresse cette solution\u00a0?',
      answer:
        'Écoles privées, cliniques, pharmacies, boulangeries, hôtels et PME avec une consommation électrique significative.',
    },
    {
      question: 'Quelles économies puis-je espérer\u00a0?',
      answer:
        "Jusqu'à 30\u00a0% sur votre facture d'électricité, selon votre profil de consommation et votre zone climatique.",
    },
    {
      question: "Combien de temps dure l'installation\u00a0?",
      answer: 'De 4 à 8 semaines, selon la taille du projet.',
    },
    {
      question: 'Que se passe-t-il en cas de panne ou de problème technique\u00a0?',
      answer:
        'La maintenance est incluse pendant toute la durée du contrat. Notre plateforme détecte les anomalies et notre équipe intervient rapidement.',
    },
    {
      question: "Puis-je devenir propriétaire de l'installation\u00a0?",
      answer:
        "Oui. À l'issue du contrat de service énergétique, l'installation vous appartient et 100\u00a0% des économies vous reviennent.",
    },
  ];

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Solution — Joya Energy',
      description:
        "Audit, installation et suivi de la performance dans un seul contrat de service énergétique — 0 DT d'investissement initial.",
      url: 'https://joya-energy.com/notre-solution',
      keywords:
        'solution énergétique Tunisie, contrat de service énergétique, solaire entreprise, suivi performance Joya OS',
    });
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }
}
