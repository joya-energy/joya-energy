import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';
import { lucideChevronDown, lucideMail } from '@ng-icons/lucide';
import { FAQ_ITEMS } from '../../../../shared/data/faq.data';

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
  /** First 6 FAQs on landing; full list is in shared/data/faq.data.ts */
  protected readonly faqData = FAQ_ITEMS.slice(0, 6);

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
