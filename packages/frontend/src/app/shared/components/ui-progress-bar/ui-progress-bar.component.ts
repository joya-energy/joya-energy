import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

@Component({
  selector: 'app-ui-progress-bar',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './ui-progress-bar.component.html',
  styleUrls: ['./ui-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ lucideCheck })
  ]
})
export class UiProgressBarComponent {
  @Input() step: number = 1;
  @Input() title: string = '';
  @Input() progress: number = 0; // 0-100
  @Input() completed: boolean = false;
  @Input() isFocused: boolean = false; // When this step is the current/active step

  protected readonly displayProgress = computed(() => {
    return Math.min(Math.max(this.progress, 0), 100);
  });

  protected readonly displayPercentage = computed(() => {
    return `${Math.round(this.displayProgress())}%`;
  });

  protected readonly isActive = computed(() => {
    return this.progress > 0 || this.completed;
  });
}
