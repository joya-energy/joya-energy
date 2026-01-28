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

  protected getMonthOptions(): SelectOption[] {
    const months = [
      { label: 'Janvier', value: '1' },
      { label: 'Février', value: '2' },
      { label: 'Mars', value: '3' },
      { label: 'Avril', value: '4' },
      { label: 'Mai', value: '5' },
      { label: 'Juin', value: '6' },
      { label: 'Juillet', value: '7' },
      { label: 'Août', value: '8' },
      { label: 'Septembre', value: '9' },
      { label: 'Octobre', value: '10' },
      { label: 'Novembre', value: '11' },
      { label: 'Décembre', value: '12' }
    ];
    return months;
  }
}
