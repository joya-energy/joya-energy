import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideArrowRight } from '@ng-icons/lucide';
import { FAQ_ITEMS } from '../../data/faq.data';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideChevronDown, lucideArrowRight })],
})
export class FaqSectionComponent {
  protected readonly title = 'Nous répondons à vos questions';
  protected readonly subtitle =
    'Toutes vos questions vous sera donnée sur notre solution énergétique joya.';
  protected readonly ctaText = 'Vous ne trouvez pas la réponse à votre question ?';
  protected readonly ctaButton = 'Contactez-nous';
  protected readonly ctaLink = '/contact';

  protected readonly faqs = signal<FAQ[]>(FAQ_ITEMS.map((item) => ({ ...item, isOpen: false })));

  protected toggleFaq(index: number): void {
    this.faqs.update((faqs) => {
      const newFaqs = [...faqs];
      newFaqs[index] = {
        ...newFaqs[index],
        isOpen: !newFaqs[index].isOpen,
      };
      return newFaqs;
    });
  }
}
