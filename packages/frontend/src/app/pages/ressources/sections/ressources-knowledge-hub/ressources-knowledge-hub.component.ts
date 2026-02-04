import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeCardComponent } from '../knowledge-card/knowledge-card.component';
import type { RessourcesIconName } from '../performance-icons/performance-icons.component';

interface ArticleItem {
  icon: RessourcesIconName;
  badge: string;
  title: string;
  description: string;
  linkText: string;
  routerLink: string;
}

@Component({
  selector: 'app-ressources-knowledge-hub',
  standalone: true,
  imports: [CommonModule, KnowledgeCardComponent],
  templateUrl: './ressources-knowledge-hub.component.html',
  styleUrl: './ressources-knowledge-hub.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RessourcesKnowledgeHubComponent {
  protected readonly articles: ArticleItem[] = [
    {
      icon: 'guide',
      badge: 'Guide',
      title: "Comment calculer et optimiser le ROI d'une installation solaire ?",
      description:
        'Découvrez les métriques clés, les aides disponibles et les erreurs à éviter pour maximiser la rentabilité de votre projet photovoltaïque.',
      linkText: 'Lire le guide',
      routerLink: '/ressources',
    },
    {
      icon: 'case-study',
      badge: 'Cas Client',
      title: 'Comment un audit énergétique a permis à une PME de réduire sa facture de 18%',
      description:
        "Analyse d'un cas réel, des premières mesures aux actions implémentées, et les résultats obtenus sur 12 mois.",
      linkText: 'Découvrir le cas client',
      routerLink: '/ressources',
    },
    {
      icon: 'faq',
      badge: 'FAQ',
      title: 'Le Tiers-Investissement et le modèle ESCO, expliqués simplement',
      description:
        'Votre projet peut-il être financé à 100% par un tiers ? Comprenez le fonctionnement et les avantages de ce modèle.',
      linkText: 'Comprendre le modèle',
      routerLink: '/faq',
    },
  ];
}
