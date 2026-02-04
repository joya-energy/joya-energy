import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';

@Component({
  selector: 'app-field-tooltip',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './field-tooltip.component.html',
  styleUrls: ['./field-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'field-tooltip'
  },
  providers: [provideIcons({ lucideInfo })],
})
export class FieldTooltipComponent {
  private readonly active = signal(false);
  private readonly position = signal({ top: '0px', left: '0px' });

  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() options: ReadonlyArray<string> = [];

  protected readonly isOpen = computed(() => this.active());
  protected readonly panelStyle = computed(() => this.position());

  protected open(event: MouseEvent): void {
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    
    this.position.set({
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`
    });
    
    this.active.set(true);
  }

  protected close(): void {
    this.active.set(false);
  }
}

