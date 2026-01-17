import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideArrowRight } from '@ng-icons/lucide';

interface FAQ {
  question: string;
  answer: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideChevronDown, lucideArrowRight })]
})
export class FaqSectionComponent {
  protected readonly title = 'Nous répondons à vos questions';
  protected readonly subtitle = 'Toutes vos questions vous sera donnée sur notre solution énergétique joya.';
  protected readonly ctaText = 'Vous ne trouvez pas la réponse à votre question ?';
  protected readonly ctaButton = 'Contactez-nous';
  protected readonly ctaLink = '/contact';
  
  protected readonly faqs = signal<FAQ[]>([
    {
      question: 'Comment fonctionne le financement solaire Joya ?',
      answer: 'Joya analyse votre consommation, conçoit une solution énergétique adaptée à votre site, puis en assure le déploiement et le suivi de la performance dans le temps.',
      isOpen: false
    },
    {
      question: 'À quelles entreprises s\'adresse cette solution ?',
      answer: 'La solution Joya s\'adresse aux entreprises, commerces et sites professionnels souhaitant réduire durablement leurs coûts énergétiques sans complexité technique.',
      isOpen: false
    },
    {
      question: 'Quelles économies puis-je espérer ?',
      answer: 'Les économies dépendent de votre consommation et de votre site, mais elles peuvent atteindre jusqu\'à 40 %, avec des résultats mesurés et suivis dans le temps.',
      isOpen: false
    },
    {
      question: 'Combien de temps dure l\'installation ?',
      answer: 'Après l\'étude énergétique, l\'installation est généralement réalisée en quelques semaines, selon la configuration du site et les démarches nécessaires.',
      isOpen: false
    },
    {
      question: 'Que se passe-t-il en cas de panne ou de problème technique ?',
      answer: 'Joya assure le suivi, la maintenance et l\'assistance technique afin de garantir la continuité et la performance de la solution.',
      isOpen: false
    },
    {
      question: 'Dois-je gérer la solution au quotidien ?',
      answer: 'Non. Joya prend en charge le pilotage énergétique et met à votre disposition une plateforme digitale pour suivre simplement les résultats.',
      isOpen: false
    }
  ]);
  
  protected toggleFaq(index: number): void {
    this.faqs.update(faqs => {
      const newFaqs = [...faqs];
      newFaqs[index] = {
        ...newFaqs[index],
        isOpen: !newFaqs[index].isOpen
      };
      return newFaqs;
    });
  }
}


