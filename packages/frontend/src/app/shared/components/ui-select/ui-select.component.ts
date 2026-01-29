import { CommonModule } from '@angular/common';
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
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideCheck } from '@ng-icons/lucide';

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
  private documentClickHandler = this.handleDocumentClick.bind(this);

  @Input() options: ReadonlyArray<string> = [];
  @Input() placeholder: string = 'Sélectionnez...';
  @Input() disabled: boolean = false;
  @Input() label: string = '';
  @Input() multiple = false;

  protected isOpen = signal(false);
  private singleValue = signal('');
  private multiSelection = signal<string[]>([]);
  private isUpdating = false;
  
  protected readonly displayValue = computed(() => {
    if (this.multiple) {
      const selection = this.multiSelection();
      if (selection.length === 0) return '';
      if (selection.length === 1) return selection[0];
      return `${selection.length} éléments sélectionnés`;
    }
    return this.singleValue();
  });

  protected readonly hasSelection = computed(() => {
    return this.multiple ? this.multiSelection().length > 0 : !!this.singleValue();
  });
  
  private onChange: (value: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    document.addEventListener('click', this.documentClickHandler, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.documentClickHandler, true);
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
    if (this.disabled) return;
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.onTouched();
    }
  }

  selectOption(option: string): void {
    if (this.disabled) return;

    if (this.multiple) {
      this.isUpdating = true;
      const current = this.multiSelection();
      const isSelected = current.includes(option);
      const updated = isSelected
        ? current.filter(item => item !== option)
        : [...current, option];
            
      this.multiSelection.set(updated);
      this.onChange(updated);
      
      setTimeout(() => {
        this.isUpdating = false;
      }, 0);
      
      return;
    }

    // Single select
    this.singleValue.set(option);
    this.onChange(option);
    this.isOpen.set(false);
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

  protected isSelected(option: string): boolean {
    return this.multiple
      ? this.multiSelection().includes(option)
      : this.singleValue() === option;
  }
}
