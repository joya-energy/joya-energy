import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronUp, lucideChevronDown } from '@ng-icons/lucide';
import { FieldTooltipComponent } from '../field-tooltip/field-tooltip.component';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent, FieldTooltipComponent],
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    },
    provideIcons({ lucideChevronUp, lucideChevronDown })
  ]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'number' = 'text';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() icon: string = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() tooltipTitle: string = '';
  @Input() tooltipDescription: string = '';
  @Input() tooltipOptions: string[] = [];
  @Input() min: number | null = null;
  @Input() max: number | null = null;

  // Form control for reactive forms
  @Input() formControlName: string = '';
  control: FormControl = new FormControl();

  private onChange: (value: string | number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | number | null | undefined): void {
    this.control.setValue(value ?? '', { emitEvent: false });
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
    this.control.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  increment(): void {
    if (this.type === 'number' && !this.disabled) {
      const current = Number(this.control.value) || 0;
      const newValue = this.max !== null ? Math.min(current + 1, this.max) : current + 1;
      this.control.setValue(newValue);
      this.onChange(newValue);
    }
  }

  decrement(): void {
    if (this.type === 'number' && !this.disabled) {
      const current = Number(this.control.value) || 0;
      const newValue = this.min !== null ? Math.max(current - 1, this.min) : current - 1;
      this.control.setValue(newValue);
      this.onChange(newValue);
    }
  }
}
