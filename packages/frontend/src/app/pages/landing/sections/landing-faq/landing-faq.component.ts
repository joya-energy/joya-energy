import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';
import { lucideChevronDown, lucideMail } from '@ng-icons/lucide';

interface FAQItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent, LandingBadgeComponent],
  templateUrl: './landing-faq.component.html',
  styleUrl: './landing-faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideMail,
    }),
  ],
})
export class LandingFaqComponent {
  protected readonly faqData: FAQItem[] = [
    {
      question: "Comment fonctionne le financement solaire Joya ?",
      answer: "Notre solution de financement prend en charge 100% de l'investissement initial pour l'installation de panneaux solaires sur votre bâtiment professionnel. Vous ne payez que l'électricité produite, à un tarif inférieur à celui du réseau, ce qui vous permet de réaliser des économies immédiates sans immobiliser votre trésorerie.",
    },
    {
      question: "À quelles entreprises s'adresse cette solution ?",
      answer: "Notre solution s'adresse aux PME, ETI et grands groupes qui souhaitent réduire leurs coûts énergétiques et leur empreinte carbone sans investissement initial. Idéale pour les entreprises disposant d'une toiture exploitable et consommant l'électricité en journée.",
    },
    {
      question: "Quelles économies puis-je espérer ?",
      answer: "Les économies dépendent de votre profil de consommation et de l'ensoleillement de votre région, mais nos clients économisent en moyenne entre 20% et 40% sur leurs factures d'électricité dès la première année. Notre outil de simulation vous donne une estimation personnalisée en quelques minutes.",
    },
    {
      question: "Combien de temps dure l'installation ?",
      answer: "La durée d'installation varie selon la taille du projet, mais elle est généralement comprise entre 2 et 4 semaines. Nous nous occupons de toutes les démarches administratives et techniques, ce qui permet de minimiser l'impact sur votre activité.",
    },
    {
      question: "Que se passe-t-il en cas de panne ou de problème technique ?",
      answer: "Notre contrat inclut une garantie complète de performance et de maintenance pendant toute la durée du partenariat. Une équipe technique surveille en permanence la production et intervient rapidement en cas d'anomalie, sans frais supplémentaires pour vous.",
    },
    {
      question: "Puis-je devenir propriétaire de l'installation ?",
      answer: "Oui, nos contrats prévoient généralement une option d'achat que vous pouvez exercer après une période définie, généralement à partir de la 5ème année. Le prix d'achat est fixé dès le départ, ce qui vous permet d'anticiper cette décision en toute transparence.",
    },
  ];

  protected readonly openItems = signal<Set<number>>(new Set([0])); // First item open by default

  protected toggleItem(index: number): void {
    const current = this.openItems();
    const newSet = new Set(current);

    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }

    this.openItems.set(newSet);
  }

  protected isOpen(index: number): boolean {
    return this.openItems().has(index);
  }
}
