import { Component, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideArrowRight, 
  lucideArrowLeft,
  lucideHome,
  lucideBuilding2,
  lucideFactory,
  lucideWarehouse,
  lucideZap,
  lucideFlame,
  lucideDroplet,
  lucideMapPin
} from '@ng-icons/lucide';

// Base Components
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { UiSelectComponent, SelectOption } from '../../shared/components/ui-select/ui-select.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';

export interface SimulatorStep {
  number: number;
  title: string;
  description?: string;
  fields: StepField[];
  isResult?: boolean;
}

export interface StepField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'select-icon' | 'box' | 'box-icon';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[] | string[];
  icon?: string;
  iconPosition?: 'left' | 'top';
  tooltipTitle?: string;
  tooltipDescription?: string;
  tooltipOptions?: string[];
  min?: number;
  max?: number;
  condition?: (form: any) => boolean;
}

@Component({
  selector: 'app-energy-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    UiStepTimelineComponent,
    UiSelectComponent,
    UiInputComponent,
    UiProgressBarComponent,
  ],
  templateUrl: './energy-audit.component.html',
  styleUrls: ['./energy-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideArrowLeft,
      lucideHome,
      lucideBuilding2,
      lucideFactory,
      lucideWarehouse,
      lucideZap,
      lucideFlame,
      lucideDroplet,
      lucideMapPin
    })
  ]
})
export class EnergyAuditComponent implements OnInit, OnDestroy {
  private fb = new FormBuilder();
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Prevent body scrolling when this component is active
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Restore body scrolling when component is destroyed
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  // Step configuration
  protected readonly steps: SimulatorStep[] = [
    {
      number: 1,
      title: 'Informations de base',
      description: 'Commencez par fournir les informations essentielles sur votre bâtiment et votre consommation énergétique.',
      fields: [
        {
          name: 'buildingType',
          label: 'Type de bâtiment',
          type: 'box-icon',
          required: true,
          options: [
            { label: 'Résidentiel', value: 'residential', icon: 'lucideHome' },
            { label: 'Bureaux', value: 'office', icon: 'lucideBuilding2' },
            { label: 'Industriel', value: 'industrial', icon: 'lucideFactory' },
            { label: 'Entrepôt', value: 'warehouse', icon: 'lucideWarehouse' }
          ],
          iconPosition: 'top'
        },
        {
          name: 'surfaceArea',
          label: 'Surface (m²)',
          type: 'number',
          required: true,
          placeholder: '0',
          tooltipTitle: 'Surface du bâtiment',
          tooltipDescription: 'Entrez la surface totale de votre bâtiment en m²'
        },
        {
          name: 'address',
          label: 'Adresse',
          type: 'text',
          required: true,
          placeholder: 'Entrez votre adresse',
          icon: 'lucideMapPin'
        }
      ]
    },
    {
      number: 2,
      title: 'Consommation énergétique',
      fields: [
        {
          name: 'monthlyConsumption',
          label: 'Consommation mensuelle (kWh)',
          type: 'number',
          required: true,
          placeholder: '0',
          tooltipTitle: 'Consommation mensuelle',
          tooltipDescription: 'Votre consommation moyenne mensuelle en kilowatt-heures'
        },
        {
          name: 'energyType',
          label: 'Type d\'énergie',
          type: 'box-icon',
          required: true,
          options: [
            { label: 'Électricité', value: 'electricity', icon: 'lucideZap' },
            { label: 'Gaz', value: 'gas', icon: 'lucideFlame' },
            { label: 'Eau', value: 'water', icon: 'lucideDroplet' }
          ],
          iconPosition: 'top'
        },
        {
          name: 'tariffType',
          label: 'Type de tarif',
          type: 'select',
          required: true,
          options: ['Tarif simple', 'Tarif double', 'Tarif triple'],
          placeholder: 'Sélectionnez un tarif'
        }
      ]
    },
    {
      number: 3,
      title: 'Équipements',
      fields: [
        {
          name: 'heatingSystem',
          label: 'Système de chauffage',
          type: 'select',
          required: true,
          options: ['Central', 'Individuel', 'Aucun'],
          placeholder: 'Sélectionnez un système'
        },
        {
          name: 'coolingSystem',
          label: 'Système de climatisation',
          type: 'select',
          required: true,
          options: ['Central', 'Individuel', 'Aucun'],
          placeholder: 'Sélectionnez un système'
        },
        {
          name: 'insulation',
          label: 'Isolation',
          type: 'box',
          required: true,
          options: ['Bonne', 'Moyenne', 'Faible', 'Aucune']
        }
      ]
    },
    {
      number: 4,
      title: 'Informations complémentaires',
      fields: [
        {
          name: 'openingHours',
          label: 'Heures d\'ouverture par jour',
          type: 'number',
          required: true,
          placeholder: '0',
          min: 0,
          max: 24
        },
        {
          name: 'occupancy',
          label: 'Nombre d\'occupants',
          type: 'number',
          required: true,
          placeholder: '0',
          min: 1
        },
        {
          name: 'notes',
          label: 'Notes supplémentaires',
          type: 'text',
          required: false,
          placeholder: 'Ajoutez des informations pertinentes...'
        }
      ]
    },
    {
      number: 5,
      title: 'Résultats',
      isResult: true,
      fields: []
    }
  ];

  protected readonly currentStep = signal<number>(1);
  protected readonly form = this.fb.group({});

  // Calculate progress for each step
  protected readonly stepProgress = computed(() => {
    const progress: Record<number, number> = {};
    
    this.steps.forEach(step => {
      if (step.isResult) {
        progress[step.number] = 0;
        return;
      }

      const stepFields = step.fields.filter(field => this.isFieldVisible(field));
      if (stepFields.length === 0) {
        progress[step.number] = 0;
        return;
      }

      const filledFields = stepFields.filter(field => {
        const control = this.form.get(field.name);
        if (!control) return false;
        const value = control.value;
        return value !== null && value !== '' && value !== undefined;
      });

      progress[step.number] = Math.round((filledFields.length / stepFields.length) * 100);
    });

    return progress;
  });

  // Get current step data
  protected readonly currentStepData = computed(() => {
    return this.steps.find(s => s.number === this.currentStep()) || this.steps[0];
  });

  // Calculate overall progress
  protected readonly overallProgress = computed(() => {
    const totalSteps = this.steps.filter(s => !s.isResult).length;
    if (totalSteps === 0) return 0;
    
    const totalProgress = this.steps
      .filter(s => !s.isResult)
      .reduce((sum, step) => sum + this.stepProgress()[step.number], 0);
    
    return Math.round(totalProgress / totalSteps);
  });

  // Check if we can proceed to next step
  protected readonly canProceed = computed(() => {
    const step = this.currentStepData();
    if (step.isResult) return false;

    const stepFields = step.fields.filter(field => this.isFieldVisible(field) && field.required);
    return stepFields.every(field => {
      const control = this.form.get(field.name);
      if (!control) return false;
      return control.valid && control.value !== null && control.value !== '';
    });
  });

  constructor() {
    // Initialize form with all fields
    this.steps.forEach(step => {
      step.fields.forEach(field => {
        const validators = field.required ? [Validators.required] : [];
        this.form.addControl(field.name, this.fb.control(null, validators));
      });
    });
  }

  protected isFieldVisible(field: StepField): boolean {
    if (!field.condition) return true;
    return field.condition(this.form.value);
  }

  protected nextStep(): void {
    if (!this.canProceed()) return;
    
    const nextStepNum = this.currentStep() + 1;
    if (nextStepNum <= this.steps.length) {
      this.currentStep.set(nextStepNum);
    }
  }

  protected previousStep(): void {
    const prevStepNum = this.currentStep() - 1;
    if (prevStepNum >= 1) {
      this.currentStep.set(prevStepNum);
    }
  }

  protected goToStep(stepNumber: number): void {
    const completedSteps = this.steps.filter(step => {
      if (step.isResult) return false;
      return this.stepProgress()[step.number] === 100;
    }).map(s => s.number);

    if (stepNumber <= this.currentStep() || completedSteps.includes(stepNumber)) {
      this.currentStep.set(stepNumber);
    }
  }

  protected submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Form submitted:', this.form.value);
    
    const resultStep = this.steps.find(s => s.isResult);
    if (resultStep) {
      this.currentStep.set(resultStep.number);
    }
  }

  protected getFieldOptions(field: StepField): SelectOption[] | string[] {
    if (!field.options) return [];
    
    if (field.options.length > 0 && typeof field.options[0] === 'object') {
      return field.options as SelectOption[];
    }
    
    return (field.options as string[]).map(opt => ({ label: opt, value: opt }));
  }

  protected getFieldOptionsForIcon(field: StepField): SelectOption[] {
    const options = this.getFieldOptions(field);
    if (options.length > 0 && typeof options[0] === 'object') {
      return options as SelectOption[];
    }
    return (options as string[]).map(opt => ({ label: opt, value: opt }));
  }
}
