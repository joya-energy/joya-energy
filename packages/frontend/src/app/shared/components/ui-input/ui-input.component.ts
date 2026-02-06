import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef,
  inject,
  Optional,
  Self,
  computed,
  Injector,
  OnInit,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormControl,
  NgControl,
} from '@angular/forms';
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
      multi: true,
    },
    provideIcons({ lucideChevronUp, lucideChevronDown }),
  ],
})
export class UiInputComponent implements ControlValueAccessor, OnInit {
  @Input() type: 'text' | 'number' | 'tel' = 'text';
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

  private injector = inject(Injector);
  private ngControl: NgControl | null = null;

  // Form control - will be injected from parent when used with formControlName
  private _control: FormControl | null = null;

  // Getter that ensures control exists
  get control(): FormControl {
    if (!this._control) {
      // Try to get NgControl lazily
      try {
        this.ngControl = this.injector.get(NgControl, null);
        if (this.ngControl?.control) {
          this.ngControl.valueAccessor = this;
          this._control = this.ngControl.control as FormControl;
        }
      } catch {
        // NgControl not available, create internal control
      }
      if (!this._control) {
        this._control = new FormControl();
      }
    }
    return this._control;
  }

  // Track if control is touched and has errors
  protected readonly showErrors = computed(() => {
    const ctrl = this.control;
    return ctrl && ctrl.invalid && ctrl.touched;
  });

  protected readonly errorMessage = computed(() => {
    const ctrl = this.control;
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';

    if (ctrl.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (ctrl.hasError('email')) {
      return 'Veuillez entrer une adresse email valide';
    }
    if (ctrl.hasError('pattern')) {
      if (this.type === 'text' && this.label.toLowerCase().includes('téléphone')) {
        return 'Format invalide. Exemple: 51845578 ou +21651845578';
      }
      return 'Format invalide';
    }
    if (ctrl.hasError('min')) {
      const min = ctrl.getError('min')?.min;
      return `La valeur doit être au moins ${min}`;
    }
    if (ctrl.hasError('max')) {
      const max = ctrl.getError('max')?.max;
      return `La valeur doit être au plus ${max}`;
    }
    return 'Valeur invalide';
  });

  private onChange: (value: string | number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit(): void {
    // Ensure control is initialized
    this.control;
  }

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
