import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
  effect
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
  private _progress = signal(0);
  private _completed = signal(false);
  private _isFocused = signal(false);

  @Input() set progress(value: number) {
    this._progress.set(value);
  }
  get progress(): number {
    return this._progress();
  }

  @Input() set completed(value: boolean) {
    this._completed.set(value);
  }
  get completed(): boolean {
    return this._completed();
  }

  @Input() set isFocused(value: boolean) {
    this._isFocused.set(value);
  }
  get isFocused(): boolean {
    return this._isFocused();
  }

  @Input() step: number = 1;
  @Input() title: string = '';

  protected readonly displayProgress = computed(() => {
    return Math.min(Math.max(this._progress(), 0), 100);
  });

  protected readonly displayPercentage = computed(() => {
    return `${Math.round(this.displayProgress())}%`;
  });

  protected readonly isActive = computed(() => {
    return this._progress() > 0 || this._completed();
  });
}
