import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideSun,
  lucideZap,
  lucideCalendar,
  lucideBuilding2,
  lucideMapPin,
  lucideDownload,
  lucideClock,
  lucideBarChart3,
  lucideTrendingUp,
  lucideWallet,
  lucideSettings,
  lucidePercent,
  lucideLeaf,
  lucideCloud,
  lucideTreePine,
  lucideLightbulb,
  lucidePhone,
  lucideFileText,
  lucideCreditCard,
  lucideActivity
} from '@ng-icons/lucide';
import { trigger, transition, style, animate } from '@angular/animations';
import { finalize } from 'rxjs/operators';

// Base layout components (from energy audit template)
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';

// Form UI components reused from old solar simulator
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { FieldTooltipComponent } from '../../shared/components/field-tooltip/field-tooltip.component';
import { GoogleMapsInputComponent, AddressData } from '../../shared/components/google-maps-input/google-maps-input.component';
import { UploadCardComponent, UploadCardConfig } from '../../shared/components/upload-card';

// Services and Types
import { NotificationStore } from '../../core/notifications/notification.store';
import { AuditSolaireService, CreateSimulationPayload } from '../../core/services/audit-solaire.service';
import { AuditSolaireFormService } from '../audit-solaire/audit-solaire.form.service';
import { AuditSolaireFormStep } from '../audit-solaire/audit-solaire.types';
import { IAuditSolaireSimulation } from '@shared/interfaces';
import { BuildingTypes } from '@shared';
import { SimulatorStep, StepField } from '../energy-audit/types/energy-audit.types';

interface BuildingTypeCard {
  id: BuildingTypes;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-solar-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    UiStepTimelineComponent,
    UiProgressBarComponent,
    UiSelectComponent,
    UiInputComponent,
    FieldTooltipComponent,
    GoogleMapsInputComponent,
    UploadCardComponent,
    DatePipe
  ],
  templateUrl: './solar-audit.component.html',
  styleUrls: ['./solar-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ]),
    trigger('resultCards', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideArrowLeft,
      lucideSun,
      lucideZap,
      lucideCalendar,
      lucideBuilding2,
      lucideMapPin,
      lucideDownload,
      lucideClock,
      lucideBarChart3,
      lucideTrendingUp,
      lucideWallet,
      lucideSettings,
      lucidePercent,
      lucideLeaf,
      lucideCloud,
      lucideTreePine,
      lucideLightbulb,
      lucidePhone,
      lucideFileText,
      lucideCreditCard,
      lucideActivity
    })
  ]
})
export class SolarAuditComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly formService = inject(AuditSolaireFormService);
  private readonly auditService = inject(AuditSolaireService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly cdr = inject(ChangeDetectorRef);

  // Reuse existing typed form from old solar simulator
  protected readonly form: FormGroup = this.formService.buildForm();

  // Wizard steps definition, using generic template model
  protected readonly steps: SimulatorStep[] = [
    {
      number: 1,
      title: 'Facture & consommation',
      description: 'Indiquez votre facture mensuelle ou téléchargez votre facture récente.',
      fields: [
        { name: 'consumption.hasInvoice', label: 'Facture disponible', type: 'select', required: true },
        {
          name: 'consumption.measuredAmountTnd',
          label: 'Montant mensuel (TND)',
          type: 'number',
          required: true,
          condition: (value) => value?.consumption?.hasInvoice === 'no'
        } as StepField,
        {
          name: 'consumption.referenceMonth',
          label: 'Mois de référence',
          type: 'select',
          required: true,
          condition: (value) => value?.consumption?.hasInvoice === 'no'
        } as StepField
      ]
    },
    {
      number: 2,
      title: 'Bâtiment & activité',
      description: 'Précisez le type de bâtiment et sa zone climatique.',
      fields: [
        {
          name: 'building.buildingType',
          label: 'Type de bâtiment',
          type: 'select',
          required: true
        },
        {
          name: 'building.climateZone',
          label: 'Zone climatique',
          type: 'select',
          required: true
        }
      ]
    },
    {
      number: 3,
      title: 'Informations personnelles & localisation',
      description: 'Indiquez l’adresse exacte de votre site pour estimer l’ensoleillement.',
      fields: [
        {
          name: 'personal.fullName',
          label: 'Nom complet',
          type: 'text',
          required: true
        },
        {
          name: 'personal.companyName',
          label: 'Entreprise',
          type: 'text',
          required: true
        },
        {
          name: 'personal.email',
          label: 'Email',
          type: 'text',
          required: true
        },
        {
          name: 'personal.phoneNumber',
          label: 'Téléphone',
          type: 'text',
          required: true
        },
        {
          name: 'location.address',
          label: 'Adresse complète du bâtiment',
          type: 'text',
          required: true
        }
      ]
    },
    {
      number: 4,
      title: 'Résultats',
      description: 'Analyse technique et économique de votre installation solaire.',
      fields: [],
      isResult: true
    }
  ];

  // Expose original field configs from old form service for richer UI
  protected readonly consumptionFields = this.formService.consumptionFields;
  protected readonly climateZones = this.formService.climateZones;
  protected readonly months = this.formService.months;
  protected readonly personalFields = this.formService.personalFields;

  // Month labels for ui-select (computed to avoid template arrow functions)
  protected readonly monthLabels = computed(() => {
    return this.months.map(m => m.label);
  });

  // Invoice choice options for ui-select
  protected readonly invoiceOptions = [
    { label: 'Oui, j\'ai une facture récente', value: 'yes' },
    { label: 'Non, je souhaite saisir manuellement', value: 'no' }
  ];

  protected readonly buildingTypeCards: BuildingTypeCard[] = [
    { id: BuildingTypes.CAFE_RESTAURANT, label: 'Café / Restaurant', icon: 'lucideZap' },
    { id: BuildingTypes.OFFICE_ADMIN_BANK, label: 'Bureau / Banque', icon: 'lucideBuilding2' },
    { id: BuildingTypes.LIGHT_WORKSHOP, label: 'Atelier', icon: 'lucideZap' },
    { id: BuildingTypes.HOTEL_GUESTHOUSE, label: 'Hôtel', icon: 'lucideBuilding2' },
    { id: BuildingTypes.CLINIC_MEDICAL, label: 'Clinique', icon: 'lucideBuilding2' },
    { id: BuildingTypes.HEAVY_FACTORY, label: 'Usine', icon: 'lucideZap' },
    { id: BuildingTypes.SCHOOL_TRAINING, label: 'École', icon: 'lucideBuilding2' },
    { id: BuildingTypes.BEAUTY_CENTER, label: 'Centre esthétique', icon: 'lucideZap' },
    { id: BuildingTypes.TEXTILE_PACKAGING, label: 'Ind. textile', icon: 'lucideZap' },
    { id: BuildingTypes.FOOD_INDUSTRY, label: 'Ind. alimentaire', icon: 'lucideZap' },
    { id: BuildingTypes.PLASTIC_INJECTION, label: 'Ind. plastique', icon: 'lucideZap' },
    { id: BuildingTypes.COLD_AGRO_INDUSTRY, label: 'Ind. froid', icon: 'lucideZap' }
  ];

  protected readonly uploadCardConfig: UploadCardConfig = {
    title: 'Téléchargez votre facture d\'électricité',
    subtitle: 'ou cliquez pour sélectionner un fichier',
    acceptedTypes: 'image/*,application/pdf',
    maxSizeText: 'Formats: PDF, JPG, PNG (max 10MB)',
    extractButtonText: 'Continuer',
    manualEntryButtonText: 'Saisir manuellement',
    selectedFileText: 'Facture sélectionnée',
    changeFileText: 'Changer de fichier'
  };

  // Wizard state
  protected readonly currentStep = signal<number>(1);
  protected readonly isSubmitting = signal(false);
  protected readonly isGeneratingPDF = signal(false);
  protected readonly simulationResult = signal<IAuditSolaireSimulation | null>(null);

  // Invoice choice mirror for easier template binding
  protected readonly invoiceChoice = signal<'yes' | 'no' | null>(null);

  // Force recomputation when form changes
  private readonly formUpdateTrigger = signal(0);

  // Progress per step
  protected readonly stepProgress = computed(() => {
    this.formUpdateTrigger();

    const progress: Record<number, number> = {};
    const formValue = this.form.value;

    this.steps.forEach(step => {
      if (step.isResult) {
        progress[step.number] = 0;
        return;
      }

      const visibleFields = step.fields.filter(field => this.isFieldVisible(field));
      if (visibleFields.length === 0) {
        progress[step.number] = 0;
        return;
      }

      const filledFields = visibleFields.filter(field => {
        const control = this.form.get(field.name);
        if (!control) return false;

        const value = control.value;
        // Check if value is actually filled (not empty object, empty string, null, undefined)
        const isFilled = value !== null && 
                        value !== '' && 
                        value !== undefined &&
                        !(typeof value === 'object' && Object.keys(value).length === 0);
        const isValid = control.valid;
        return isFilled && isValid;
      });

      progress[step.number] = Math.round((filledFields.length / visibleFields.length) * 100);
    });

    return progress;
  });

  protected readonly currentStepData = computed(() => {
    return this.steps.find(s => s.number === this.currentStep()) || this.steps[0];
  });

  protected readonly overallProgress = computed(() => {
    const current = this.currentStepData();
    if (current.isResult) return 0;
    return this.stepProgress()[current.number];
  });

  protected readonly canProceed = computed(() => {
    const step = this.currentStepData();
    if (step.isResult) return false;
    return this.stepProgress()[step.number] === 100;
  });

  protected readonly canGoBack = computed(() => this.currentStep() > 1);

  protected readonly lastFormStepNumber = 3;


  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  protected isFieldVisible(field: StepField): boolean {
    if (!field.condition) return true;
    return field.condition(this.form.value);
  }

  protected isStepClickable(stepNumber: number): boolean {
    const step = this.steps.find(s => s.number === stepNumber);
    if (!step || step.isResult) return false;
    const current = this.currentStep();
    return stepNumber < current;
  }

  protected goToStep(stepNumber: number): void {
    if (!this.isStepClickable(stepNumber)) {
      return;
    }
    if (stepNumber < this.currentStep()) {
      this.currentStep.set(stepNumber);
    }
  }

  protected nextStep(): void {
    const stepNumber = this.currentStep();

    if (stepNumber === 1) {
      const hasInvoice = this.invoiceChoice();
      if (!hasInvoice) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Sélectionnez une option',
          message: 'Veuillez indiquer si vous disposez d\'une facture récente.'
        });
        return;
      }

      if (hasInvoice === 'no') {
        const consumptionGroup = this.form.get('consumption') as FormGroup | null;
        if (!consumptionGroup || consumptionGroup.invalid) {
          consumptionGroup?.markAllAsTouched();
          this.notificationStore.addNotification({
            type: 'warning',
            title: 'Informations manquantes',
            message: 'Veuillez saisir votre montant mensuel et le mois de référence.'
          });
          return;
        }
      }
    }

    if (!this.canProceed() && stepNumber !== 1) {
      const currentStep = this.currentStepData();
      currentStep.fields.forEach(field => {
        const control = this.form.get(field.name);
        if (control) {
          control.markAsTouched();
        }
      });

      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Étape incomplète',
        message: 'Veuillez remplir tous les champs avant de continuer.'
      });
      return;
    }

    const next = stepNumber + 1;
    if (next <= this.lastFormStepNumber) {
      this.currentStep.set(next);
      return;
    }

    if (stepNumber === this.lastFormStepNumber) {
      this.submitForm();
    }
  }

  protected previousStep(): void {
    const prev = this.currentStep() - 1;
    if (prev >= 1) {
      this.currentStep.set(prev);
    }
  }

  protected handleInvoiceChoice(choice: 'yes' | 'no'): void {
    this.invoiceChoice.set(choice);
    const control = this.form.get('consumption.hasInvoice');
    if (control) {
      control.setValue(choice);
      control.markAsDirty();
      control.markAsTouched();
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    // Watch for invoice choice changes from ui-select
    this.form.get('consumption.hasInvoice')?.valueChanges.subscribe((value: 'yes' | 'no' | null) => {
      if (value === 'yes' || value === 'no') {
        this.invoiceChoice.set(value);
      }
    });

    this.form.valueChanges.subscribe(() => {
      // Update validity for all controls
      Object.keys(this.form.controls).forEach(key => {
        const groupOrControl = (this.form as FormGroup).get(key);
        if (groupOrControl instanceof FormGroup) {
          Object.keys(groupOrControl.controls).forEach(nestedKey => {
            const nestedControl = groupOrControl.get(nestedKey);
            if (nestedControl) {
              nestedControl.updateValueAndValidity({ emitEvent: false });
            }
          });
        } else if (groupOrControl) {
          groupOrControl.updateValueAndValidity({ emitEvent: false });
        }
      });

      this.formUpdateTrigger.update(v => v + 1);
      this.cdr.markForCheck();
    });
  }

  protected onBillSelected(file: File | null): void {
    const control = this.form.get('consumption.billAttachment');
    if (control) {
      control.setValue(file);
    }

    if (file) {
      this.notificationStore.addNotification({
        type: 'info',
        title: 'Facture sélectionnée',
        message: file.name
      });
    }
  }

  protected onExtractFromBill(): void {
    // For now, just proceed to manual confirmation step
    this.nextStep();
  }

  protected onManualEntry(): void {
    const billControl = this.form.get('consumption.billAttachment');
    if (billControl) {
      billControl.setValue(null);
    }
    this.handleInvoiceChoice('no');
  }

  protected onAddressChange(addressData: AddressData | null): void {
    const control = this.form.get('location.address');
    if (addressData && control) {
      control.setValue(addressData.address);
    }
  }

  protected submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }

    const value = this.form.value as any;

    // Ensure referenceMonth is always a valid month number (1-12)
    const rawReferenceMonth = value.consumption?.referenceMonth;
    let referenceMonth: number = 1;
    if (typeof rawReferenceMonth === 'number') {
      referenceMonth = rawReferenceMonth || 1;
    } else if (typeof rawReferenceMonth === 'string') {
      const month = this.months.find(m => m.label === rawReferenceMonth);
      referenceMonth = month ? month.value : 1;
    }

    // Build payload with all required fields
    // NOTE: Personal info fields (fullName, companyName, email, phoneNumber) are included
    // but backend currently doesn't use them. They will be added to backend API soon.
    // When backend is updated, these fields will already be sent automatically.
    const payload: CreateSimulationPayload = {
      // Location
      address: value.location?.address ?? '',
      
      // Consumption
      measuredAmountTnd: value.consumption?.measuredAmountTnd ?? 0,
      referenceMonth,
      
      // Building
      buildingType: value.building?.buildingType ?? '',
      climateZone: value.building?.climateZone ?? this.climateZones[0] ?? '',
      
      // Personal Info (ready for backend integration)
      // TODO: Backend will accept these fields soon - they're already being sent
      fullName: value.personal?.fullName ?? '',
      companyName: value.personal?.companyName ?? '',
      email: value.personal?.email ?? '',
      phoneNumber: value.personal?.phoneNumber ?? ''
    };

    this.isSubmitting.set(true);

    this.auditService
      .createSimulation(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (result: IAuditSolaireSimulation) => {
          this.simulationResult.set(result);
          const resultStep = this.steps.find(s => s.isResult);
          if (resultStep) {
            this.currentStep.set(resultStep.number);
          }
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation prête',
            message: 'Votre audit solaire a été généré avec succès.'
          });
        },
        error: () => {
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de générer la simulation. Veuillez réessayer.'
          });
        }
      });
  }

  protected downloadPVReport(): void {
    const result = this.simulationResult();
    if (!result?.id) {
      this.notificationStore.addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Aucune simulation trouvée. Veuillez d\'abord compléter l\'audit solaire.'
      });
      return;
    }

    this.isGeneratingPDF.set(true);
    this.auditService
      .downloadPVReport(result.id)
      .pipe(finalize(() => this.isGeneratingPDF.set(false)))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rapport-pv-joya-${result.id.substring(0, 8)}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.notificationStore.addNotification({
            type: 'success',
            title: 'PDF téléchargé',
            message: 'Le rapport PV a été téléchargé.'
          });
        },
        error: () => {
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de générer le PDF. Veuillez réessayer.'
          });
        }
      });
  }

  protected resetForm(): void {
    this.form.reset();
    this.simulationResult.set(null);
    this.currentStep.set(1);
    this.invoiceChoice.set(null);
    this.notificationStore.addNotification({
      type: 'info',
      title: 'Formulaire réinitialisé',
      message: 'Vous pouvez commencer une nouvelle simulation.'
    });
  }

  protected formatPaybackPeriod(months: number | undefined): string {
    if (months === 0 || months === null || months === undefined) return 'Payback non atteint';
    if (!Number.isFinite(months) || months < 0) return '> 25 ans';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} mois`;
    }
    if (remainingMonths === 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    }
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }
}

