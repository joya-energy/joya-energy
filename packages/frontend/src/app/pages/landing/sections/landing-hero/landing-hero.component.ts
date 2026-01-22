import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, OnInit, OnDestroy } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideClock } from '@ng-icons/lucide';
import { trigger, style, transition, animate, group, query } from '@angular/animations';
import { LandingBadgeComponent } from '../../components/landing-badge/landing-badge.component';

type ActiveTab = 'roi' | 'comparison';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ lucideCheck, lucideClock }),
  ],
  animations: [
    trigger('fadeSlide', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' })
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(8px)' })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('0.3s ease-out', style({ opacity: 0, transform: 'translateY(-8px)' }))
          ], { optional: true }),
          query(':enter', [
            animate('0.4s ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class LandingHeroComponent implements OnInit, OnDestroy {
  protected activeTab = signal<ActiveTab>('roi');
  protected horizontalLines = [0, 1, 2, 3, 4];
  protected verticalLines = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
  protected readonly rotatingWords = ['Accessible.', 'Garantie.', 'Sans investissement.'];
  protected displayedText = signal('');
  
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentIndex = 0;
  private currentText = '';
  private isDeleting = false;

  ngOnInit(): void {
    this.startTypingAnimation();
  }

  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private startTypingAnimation(): void {
    const type = () => {
      const words = this.rotatingWords;
      const currentWord = words[this.currentIndex];

      if (this.isDeleting) {
        // Delete fast
        this.currentText = currentWord.substring(0, this.currentText.length - 1);
        this.displayedText.set(this.currentText);

        if (this.currentText === '') {
          this.isDeleting = false;
          this.currentIndex = (this.currentIndex + 1) % words.length;
          this.typingTimeout = setTimeout(type, 100);
        } else {
          this.typingTimeout = setTimeout(type, 50);
        }
      } else {
        // Type slowly
        this.currentText = currentWord.substring(0, this.currentText.length + 1);
        this.displayedText.set(this.currentText);

        if (this.currentText === currentWord) {
          // Wait before deleting
          this.isDeleting = true;
          this.typingTimeout = setTimeout(type, 2000);
        } else {
          this.typingTimeout = setTimeout(type, 100);
        }
      }
    };

    type();
  }

  protected setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }
}

