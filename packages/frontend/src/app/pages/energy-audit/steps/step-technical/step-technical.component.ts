import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, SelectOption } from '../../../../shared/components/ui-select/ui-select.component';
import { EnergyAuditFormService } from '../../services/energy-audit-form.service';

@Component({
  selector: 'app-step-technical',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiInputComponent,
    UiSelectComponent
  ],
  templateUrl: './step-technical.component.html',
  styleUrls: ['./step-technical.component.scss']
})
export class StepTechnicalComponent {
  @Input() form!: FormGroup;
  private formService = inject(EnergyAuditFormService);

  // Expose options from form service
  protected readonly insulationOptions = this.formService.insulationOptions;
  protected readonly glazingOptions = this.formService.glazingOptions;
  protected readonly heatingOptions = this.formService.heatingOptions;
  protected readonly coolingOptions = this.formService.coolingOptions;

  protected getInsulationOptions(): SelectOption[] {
    return this.insulationOptions.map(opt => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getGlazingOptions(): SelectOption[] {
    return this.glazingOptions.map(opt => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getHeatingOptions(): SelectOption[] {
    return this.heatingOptions.map(opt => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getCoolingOptions(): SelectOption[] {
    return this.coolingOptions.map(opt => ({ label: opt.toString(), value: opt.toString() }));
  }

}
