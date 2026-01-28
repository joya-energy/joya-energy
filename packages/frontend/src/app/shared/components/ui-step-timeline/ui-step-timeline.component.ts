import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

export interface StepTimelineStep {
  label?: string;
  number: number;
}

@Component({
  selector: 'app-ui-step-timeline',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './ui-step-timeline.component.html',
  styleUrls: ['./ui-step-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ lucideCheck })
  ]
})
export class UiStepTimelineComponent {
  @Input() currentStep: number = 1;
  @Input() totalSteps: number = 3;
  @Input() steps: StepTimelineStep[] = [];

  protected readonly displaySteps = computed(() => {
    if (this.steps.length > 0) {
      return this.steps;
    }
    return Array.from({ length: this.totalSteps }, (_, i) => ({
      number: i + 1,
      label: undefined
    }));
  });

  protected isStepCompleted(stepNumber: number): boolean {
    return stepNumber < this.currentStep;
  }

  protected isStepActive(stepNumber: number): boolean {
    return stepNumber === this.currentStep;
  }

  protected isStepFuture(stepNumber: number): boolean {
    return stepNumber > this.currentStep;
  }
}
