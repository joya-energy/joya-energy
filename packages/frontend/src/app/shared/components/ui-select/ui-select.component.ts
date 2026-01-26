import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  Input,
  forwardRef,
  signal,
  computed,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideCheck } from '@ng-icons/lucide';

export interface SelectOption {
  label: string;
  value: string;
  icon?: string; // Icon name for ng-icon
}

export type SelectVariant = 'dropdown' | 'dropdown-icon' | 'box' | 'box-icon';
export type IconPosition = 'left' | 'top';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './ui-select.component.html',
  styleUrls: ['./ui-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true
    },
    provideIcons({ lucideChevronDown, lucideCheck })
  ]
})
export class UiSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private documentClickHandler = this.handleDocumentClick.bind(this);

  // Support both string array (legacy) and SelectOption array
  @Input() options: ReadonlyArray<string | SelectOption> = [];
  @Input() placeholder: string = 'Sélectionnez...';
  @Input() disabled: boolean = false;
  @Input() label: string = '';
  @Input() multiple = false;
  @Input() variant: SelectVariant = 'dropdown';
  @Input() iconPosition: IconPosition = 'left'; // For box-icon variant

  protected isOpen = signal(false);
  private singleValue = signal<string>('');
  private multiSelection = signal<string[]>([]);
  private isUpdating = false;
  
  protected readonly displayValue = computed(() => {
    if (this.multiple) {
      const selection = this.multiSelection();
      if (selection.length === 0) return '';
      if (selection.length === 1) {
        const option = this.getOptionByValue(selection[0]);
        return this.getOptionLabel(option);
      }
      return `${selection.length} éléments sélectionnés`;
    }
    const option = this.getOptionByValue(this.singleValue());
    return option ? this.getOptionLabel(option) : '';
  });

  protected readonly hasSelection = computed(() => {
    return this.multiple ? this.multiSelection().length > 0 : !!this.singleValue();
  });

  protected readonly normalizedOptions = computed(() => {
    return this.options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  });
  
  private onChange: (value: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', this.documentClickHandler, true);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.documentClickHandler, true);
    }
  }

  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);
    const isTooltip = target.closest('.field-tooltip') !== null;
    
    if (!clickedInside && !isTooltip && this.isOpen()) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    if (this.disabled || this.variant === 'box' || this.variant === 'box-icon') return;
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.onTouched();
    }
  }

  selectOption(option: string | SelectOption): void {
    if (this.disabled) return;

    const value = typeof option === 'string' ? option : option.value;

    if (this.multiple) {
      this.isUpdating = true;
      const current = this.multiSelection();
      const isSelected = current.includes(value);
      const updated = isSelected
        ? current.filter(item => item !== value)
        : [...current, value];
            
      this.multiSelection.set(updated);
      this.onChange(updated);
      
      setTimeout(() => {
        this.isUpdating = false;
      }, 0);
      
      return;
    }

    // Single select
    this.singleValue.set(value);
    this.onChange(value);
    this.isOpen.set(false);
  }

  protected getOptionValue(option: string | SelectOption): string {
    return typeof option === 'string' ? option : option.value;
  }

  protected getOptionLabel(option: string | SelectOption | null): string {
    if (!option) return '';
    return typeof option === 'string' ? option : option.label;
  }

  protected getOptionIcon(option: string | SelectOption): string | undefined {
    return typeof option === 'string' ? undefined : option.icon;
  }

  protected getOptionByValue(value: string): string | SelectOption | null {
    return this.options.find(opt => this.getOptionValue(opt) === value) || null;
  }

  writeValue(value: string | string[] | null | undefined): void {
    if (this.isUpdating) {
      return;
    }
    
    if (this.multiple) {
      const newValue = Array.isArray(value) ? value : [];
      this.multiSelection.set(newValue);
    } else {
      this.singleValue.set(typeof value === 'string' ? value : '');
    }
  }

  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected isSelected(option: string | SelectOption): boolean {
    const value = this.getOptionValue(option);
    return this.multiple
      ? this.multiSelection().includes(value)
      : this.singleValue() === value;
  }
}
