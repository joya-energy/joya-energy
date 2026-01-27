import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideMapPin } from '@ng-icons/lucide';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, SelectOption } from '../../../../shared/components/ui-select/ui-select.component';
import { EnergyAuditFormService } from '../../services/energy-audit-form.service';

@Component({
  selector: 'app-step-personal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiInputComponent,
    UiSelectComponent
  ],
  templateUrl: './step-personal.component.html',
  styleUrls: ['./step-personal.component.scss'],
  providers: [
    provideIcons({
      lucideMapPin
    })
  ]
})
export class StepPersonalComponent {
  @Input() form!: FormGroup;
  private formService = inject(EnergyAuditFormService);

  protected readonly governorates = this.formService.governorates;
  protected readonly tariffOptions = this.formService.tariffOptions;

  protected getGovernorateOptions(): SelectOption[] {
    return this.governorates.map(opt => ({ label: opt.toString(), value: opt.toString() }));
  }

  protected getTariffOptions(): SelectOption[] {
    return this.tariffOptions.map(opt => ({ label: opt.toString(), value: opt.toString() }));
  }
}
