import { Component, Input, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UiSelectComponent, SelectOption } from '../../../../shared/components/ui-select/ui-select.component';
import { EnergyAuditFormService } from '../../services/energy-audit-form.service';

@Component({
  selector: 'app-step-equipment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    UiSelectComponent
  ],
  templateUrl: './step-equipment.component.html',
  styleUrls: ['./step-equipment.component.scss']
})
export class StepEquipmentComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  private formService = inject(EnergyAuditFormService);
  private valueChangesSubscription?: Subscription;

  // Expose options from form service
  protected readonly hotWaterOptions = this.formService.hotWaterOptions;
  protected readonly ventilationOptions = this.formService.ventilationOptions;
  protected readonly lightingOptions = this.formService.lightingOptions;
  protected readonly coverageOptions = this.formService.coverageOptions;
  protected readonly equipmentOptions = this.formService.equipmentOptions;
  protected readonly existingMeasuresOptions = this.formService.existingMeasuresOptions;

  // Track hasExistingMeasures value as a signal
  protected readonly hasExistingMeasures = signal<boolean>(false);
  // Track the string value for ui-select (converted from boolean)
  protected readonly hasExistingMeasuresStringValue = signal<string>('');

  ngOnInit(): void {
    // Initialize signals with current form value
    const currentValue = this.form.get('hasExistingMeasures')?.value;
    this.hasExistingMeasures.set(currentValue === true);
    this.hasExistingMeasuresStringValue.set(currentValue === true ? 'true' : currentValue === false ? 'false' : '');

    // Subscribe to form control changes
    this.valueChangesSubscription = this.form.get('hasExistingMeasures')?.valueChanges.subscribe(value => {
      this.hasExistingMeasures.set(value === true);
      this.hasExistingMeasuresStringValue.set(value === true ? 'true' : value === false ? 'false' : '');
    });
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription?.unsubscribe();
  }

  protected getHasExistingMeasuresOptions(): SelectOption[] {
    return [
      { label: 'Oui', value: 'true' },
      { label: 'Non', value: 'false' }
    ];
  }

  protected onHasExistingMeasuresChange(value: string): void {
    const boolValue = value === 'true';
    this.form.get('hasExistingMeasures')?.setValue(boolValue);
    if (!boolValue) {
      // Clear existingMeasures when "no" is selected
      this.form.get('existingMeasures')?.setValue([]);
    }
  }

  protected getHotWaterOptions(): SelectOption[] {
    return this.hotWaterOptions.map((opt: string | number) => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getVentilationOptions(): SelectOption[] {
    return this.ventilationOptions.map((opt: string | number) => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getLightingOptions(): SelectOption[] {
    return this.lightingOptions.map((opt: string | number) => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getCoverageOptions(): SelectOption[] {
    return this.coverageOptions.map((opt: string | number) => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getEquipmentOptions(): SelectOption[] {
    return this.equipmentOptions.map((opt: string | number) => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getExistingMeasuresOptions(): SelectOption[] {
    return this.existingMeasuresOptions.map((opt: string | number) => ({ label: opt.toString(), value: opt.toString() }));
  }
}
