import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  ViewChild,
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
  lucideActivity,
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
import {
  GoogleMapsInputComponent,
  AddressData,
} from '../../shared/components/google-maps-input/google-maps-input.component';
import { UploadCardComponent, UploadCardConfig } from '../../shared/components/upload-card';

// Services and Types
import { NotificationStore } from '../../core/notifications/notification.store';
import {
  AuditSolaireService,
  CreateSimulationPayload,
} from '../../core/services/audit-solaire.service';
import { AuditEnergetiqueService } from '../../core/services/audit-energetique.service';
import { AuditSolaireFormService } from '../audit-solaire/audit-solaire.form.service';
import { AuditSolaireFormStep } from '../audit-solaire/audit-solaire.types';
import { IAuditSolaireSimulation } from '@shared/interfaces';
import { BuildingTypes } from '@shared';
import { SimulatorStep, StepField } from '../energy-audit/types/energy-audit.types';

import {
  BUILDING_CARD_CONFIG,
  BUILDING_ICON_REGISTRY,
} from '../../shared/icons/audit-building-icons';

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
    DatePipe,
  ],
  templateUrl: './solar-audit.component.html',
  styleUrls: ['./solar-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' })),
      ]),
    ]),
    trigger('resultCards', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  providers: [
    provideIcons({
      ...BUILDING_ICON_REGISTRY,
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
      lucideActivity,
    }),
  ],
})
export class SolarAuditComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly formService = inject(AuditSolaireFormService);
  private readonly auditService = inject(AuditSolaireService);
  private readonly auditEnergetiqueService = inject(AuditEnergetiqueService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly cdr = inject(ChangeDetectorRef);

  // Reuse existing typed form from old solar simulator
  protected readonly form: FormGroup = this.formService.buildForm();

  // Wizard steps definition, using generic template model
  protected readonly steps: SimulatorStep[] = [
    {
      number: 1,
      title: 'Facture & consommation',
      description: "Indiquez le montant de votre facture mensuelle d'électricité.",
      fields: [
        // Bill upload feature temporarily disabled
        // { name: 'consumption.hasInvoice', label: 'Facture disponible', type: 'select', required: true },
        {
          name: 'consumption.measuredAmountTnd',
          label: 'Montant mensuel (TND)',
          type: 'number',
          required: true,
          // condition: (value) => value?.consumption?.hasInvoice === 'no' // Temporarily disabled
        } as StepField,
        {
          name: 'consumption.referenceMonth',
          label: 'Mois de référence',
          type: 'select',
          required: true,
          // condition: (value) => value?.consumption?.hasInvoice === 'no' // Temporarily disabled
        } as StepField,
      ],
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
          required: true,
        },
        {
          name: 'building.climateZone',
          label: 'Zone climatique',
          type: 'select',
          required: true,
        },
      ],
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
          required: true,
        },
        {
          name: 'personal.companyName',
          label: 'Entreprise',
          type: 'text',
          required: true,
        },
        {
          name: 'personal.email',
          label: 'Email',
          type: 'text',
          required: true,
        },
        {
          name: 'personal.phoneNumber',
          label: 'Téléphone',
          type: 'text',
          required: true,
        },
        {
          name: 'location.address',
          label: 'Adresse complète du bâtiment',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      number: 4,
      title: 'Résultats',
      description: 'Analyse technique et économique de votre installation solaire.',
      fields: [],
      isResult: true,
    },
  ];

  // Expose original field configs from old form service for richer UI
  protected readonly consumptionFields = this.formService.consumptionFields;
  protected readonly climateZones = this.formService.climateZones;
  protected readonly months = this.formService.months;
  protected readonly personalFields = this.formService.personalFields;

  // Month labels for ui-select (computed to avoid template arrow functions)
  protected readonly monthLabels = computed(() => {
    return this.months.map((m) => m.label);
  });

  // Invoice choice options for ui-select
  protected readonly invoiceOptions = [
    { label: "Oui, j'ai une facture récente", value: 'yes' },
    { label: 'Non, je souhaite saisir manuellement', value: 'no' },
  ];

  protected readonly buildingTypeCards: BuildingTypeCard[] = BUILDING_CARD_CONFIG;
  protected readonly uploadCardConfig: UploadCardConfig = {
    title: "Téléchargez votre facture d'électricité",
    subtitle: 'ou cliquez pour sélectionner un fichier',
    acceptedTypes: 'image/*,application/pdf',
    maxSizeText: 'Formats: PDF, JPG, PNG (max 10MB)',
    extractButtonText: 'Continuer',
    manualEntryButtonText: 'Saisir manuellement',
    selectedFileText: 'Facture sélectionnée',
    changeFileText: 'Changer de fichier',
  };

  // Wizard state
  protected readonly currentStep = signal<number>(1);
  protected readonly isSubmitting = signal(false);
  protected readonly isGeneratingPDF = signal(false);
  protected readonly simulationResult = signal<IAuditSolaireSimulation | null>(null);

  /** Tooltip for monthly bills chart: one bubble at a time (sans or avec) on bar hover */
  protected monthlyBillsTooltip = signal<{
    monthIndex: number;
    monthLabel: string;
    billWithoutPV: number;
    billWithPV: number;
    bar: 'sans' | 'avec';
  } | null>(null);

  /** Tooltip for "Gains nets cumulés vs CAPEX" chart: bubble position between curves (relative to container) */
  protected chartTooltip = signal<{
    year: number;
    gains: number;
    capex: number;
    bubbleLocalX: number;
    bubbleLocalY: number;
  } | null>(null);

  @ViewChild('lineChartSvg') private lineChartSvg?: ElementRef<SVGSVGElement>;
  @ViewChild('lineChartSvgContainer') private lineChartSvgContainer?: ElementRef<HTMLElement>;

  // Invoice choice mirror for easier template binding
  protected readonly invoiceChoice = signal<'yes' | 'no' | null>(null);

  // Force recomputation when form changes
  private readonly formUpdateTrigger = signal(0);

  // Progress per step
  protected readonly stepProgress = computed(() => {
    this.formUpdateTrigger();

    const progress: Record<number, number> = {};
    const formValue = this.form.value;

    this.steps.forEach((step) => {
      if (step.isResult) {
        progress[step.number] = 0;
        return;
      }

      const visibleFields = step.fields.filter((field) => this.isFieldVisible(field));
      if (visibleFields.length === 0) {
        progress[step.number] = 0;
        return;
      }

      const filledFields = visibleFields.filter((field) => {
        const control = this.form.get(field.name);
        if (!control) return false;

        const value = control.value;
        // Check if value is actually filled (not empty object, empty string, null, undefined)
        const isFilled =
          value !== null &&
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
    return this.steps.find((s) => s.number === this.currentStep()) || this.steps[0];
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
    const step = this.steps.find((s) => s.number === stepNumber);
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
      // Bill upload feature temporarily disabled - only manual entry validation
      // Check only the fields we care about (ignore hasInvoice)
      const measuredAmountControl = this.form.get('consumption.measuredAmountTnd');
      const referenceMonthControl = this.form.get('consumption.referenceMonth');

      if (
        !measuredAmountControl?.value ||
        !referenceMonthControl?.value ||
        measuredAmountControl.invalid ||
        referenceMonthControl.invalid
      ) {
        measuredAmountControl?.markAsTouched();
        referenceMonthControl?.markAsTouched();
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Informations manquantes',
          message: 'Veuillez saisir votre montant mensuel et le mois de référence.',
        });
        return;
      }
    }

    // For step 1, we already validated above, so skip canProceed check
    if (stepNumber !== 1 && !this.canProceed()) {
      const currentStep = this.currentStepData();
      currentStep.fields.forEach((field) => {
        const control = this.form.get(field.name);
        if (control) {
          control.markAsTouched();
        }
      });

      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Étape incomplète',
        message: 'Veuillez remplir tous les champs avant de continuer.',
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

    // Bill upload feature temporarily disabled
    // Set default value for hasInvoice to avoid form validation errors
    const hasInvoiceControl = this.form.get('consumption.hasInvoice');
    if (hasInvoiceControl) {
      hasInvoiceControl.setValue('no', { emitEvent: false });
      hasInvoiceControl.clearValidators();
      hasInvoiceControl.updateValueAndValidity({ emitEvent: false });
    }

    // Bill upload feature temporarily disabled
    // Watch for invoice choice changes from ui-select
    // this.form.get('consumption.hasInvoice')?.valueChanges.subscribe((value: 'yes' | 'no' | null) => {
    //   if (value === 'yes' || value === 'no') {
    //     this.invoiceChoice.set(value);
    //   }
    // });

    this.form.valueChanges.subscribe(() => {
      // Update validity for all controls
      Object.keys(this.form.controls).forEach((key) => {
        const groupOrControl = (this.form as FormGroup).get(key);
        if (groupOrControl instanceof FormGroup) {
          Object.keys(groupOrControl.controls).forEach((nestedKey) => {
            const nestedControl = groupOrControl.get(nestedKey);
            if (nestedControl) {
              nestedControl.updateValueAndValidity({ emitEvent: false });
            }
          });
        } else if (groupOrControl) {
          groupOrControl.updateValueAndValidity({ emitEvent: false });
        }
      });

      this.formUpdateTrigger.update((v) => v + 1);
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
        message: file.name,
      });
    }
  }

  protected onExtractFromBill(): void {
    const billFile = this.form.get('consumption.billAttachment')?.value as File | null;

    if (!billFile) {
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Aucun fichier',
        message: "Veuillez d'abord sélectionner un fichier de facture.",
      });
      return;
    }

    // Create FormData for extraction
    const formData = new FormData();
    formData.append('billImage', billFile);

    this.isSubmitting.set(true);

    // Call extraction endpoint (reusing energy audit endpoint)
    this.auditEnergetiqueService
      .extractBillData(formData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const extracted = response.data;

            // Populate form fields with extracted data
            const consumptionControl = this.form.get('consumption');
            if (consumptionControl) {
              // Map monthlyBillAmount to measuredAmountTnd
              if (extracted.monthlyBillAmount?.value !== undefined) {
                consumptionControl
                  .get('measuredAmountTnd')
                  ?.setValue(extracted.monthlyBillAmount.value);
              }

              // Derive referenceMonth from periodEnd or periodStart
              // Note: referenceMonth field expects month label (string), not number
              if (extracted.periodEnd?.value) {
                try {
                  const periodEndDate = new Date(extracted.periodEnd.value);
                  const monthNumber = periodEndDate.getMonth() + 1; // getMonth() returns 0-11
                  if (monthNumber >= 1 && monthNumber <= 12) {
                    const monthLabel = this.months.find((m) => m.value === monthNumber)?.label;
                    if (monthLabel) {
                      consumptionControl.get('referenceMonth')?.setValue(monthLabel);
                    }
                  }
                } catch (error) {
                  console.warn('Failed to parse periodEnd date:', extracted.periodEnd.value);
                }
              } else if (extracted.periodStart?.value) {
                try {
                  const periodStartDate = new Date(extracted.periodStart.value);
                  const monthNumber = periodStartDate.getMonth() + 1;
                  if (monthNumber >= 1 && monthNumber <= 12) {
                    const monthLabel = this.months.find((m) => m.value === monthNumber)?.label;
                    if (monthLabel) {
                      consumptionControl.get('referenceMonth')?.setValue(monthLabel);
                    }
                  }
                } catch (error) {
                  console.warn('Failed to parse periodStart date:', extracted.periodStart.value);
                }
              }
            }

            this.notificationStore.addNotification({
              type: 'success',
              title: 'Données extraites',
              message:
                'Les données de votre facture ont été extraites avec succès. Veuillez vérifier et continuer.',
            });

            // Proceed to next step
            this.nextStep();
          }
        },
        error: (error) => {
          console.error('Error extracting bill data:', error);
          this.notificationStore.addNotification({
            type: 'error',
            title: "Erreur d'extraction",
            message:
              error.error?.message ||
              "Impossible d'extraire les données de la facture. Veuillez saisir les informations manuellement.",
          });
        },
      });
  }

  // Temporarily disabled - bill upload feature
  // protected onManualEntry(): void {
  //   const billControl = this.form.get('consumption.billAttachment');
  //   if (billControl) {
  //     billControl.setValue(null);
  //   }
  //   this.handleInvoiceChoice('no');
  // }

  protected onAddressChange(addressData: AddressData | null): void {
    const control = this.form.get('location.address');
    if (addressData && control) {
      control.setValue(addressData.address);
      control.markAsTouched();
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  protected submitForm(): void {
    // Check form validity and mark all fields as touched
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      // Debug: Log invalid fields
      const invalidFields: string[] = [];
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control && control.invalid) {
          if (control instanceof FormGroup) {
            Object.keys(control.controls).forEach((nestedKey) => {
              const nestedControl = control.get(nestedKey);
              if (nestedControl && nestedControl.invalid) {
                invalidFields.push(`${key}.${nestedKey}`);
              }
            });
          } else {
            invalidFields.push(key);
          }
        }
      });

      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs obligatoires.',
      });
      return;
    }

    const value = this.form.value as any;
    // Bill upload feature temporarily disabled
    // const billFile = value.consumption?.billAttachment as File | null;
    // if (billFile && this.invoiceChoice() === 'yes') {
    //   this.submitFormWithBill(billFile);
    //   return;
    // }

    // Regular JSON submission
    // Ensure referenceMonth is always a valid month number (1-12)
    const rawReferenceMonth = value.consumption?.referenceMonth;
    let referenceMonth: number = 1;
    if (typeof rawReferenceMonth === 'number') {
      referenceMonth = rawReferenceMonth || 1;
    } else if (typeof rawReferenceMonth === 'string') {
      const month = this.months.find((m) => m.label === rawReferenceMonth);
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
      phoneNumber: value.personal?.phoneNumber ?? '',
    };

    this.isSubmitting.set(true);

    this.auditService
      .createSimulation(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (result: IAuditSolaireSimulation) => {
          this.simulationResult.set(result);
          const resultStep = this.steps.find((s) => s.isResult);
          if (resultStep) {
            this.currentStep.set(resultStep.number);
          }
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation terminée',
            message: 'Voici les résultats de votre audit solaire.',
          });
          // Send PV report by email at the end (non-blocking)
          this.auditService.sendPVReportByEmail(result.id).subscribe({
            next: (emailRes) => {
              if (emailRes?.email) {
                this.notificationStore.addNotification({
                  type: 'success',
                  title: 'Rapport envoyé par email',
                  message: `Le rapport PV sera envoyé à ${emailRes.email}. Vérifiez votre boîte de réception.`,
                });
              }
            },
            error: () => {
              /* email optional */
            },
          });
        },
        error: (error) => {
          console.error('Error creating simulation:', error);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message:
              error.error?.message ||
              'Une erreur est survenue lors de la création de la simulation.',
          });
        },
      });
  }

  private submitFormWithBill(billFile: File): void {
    const value = this.form.value as any;

    // Ensure referenceMonth is always a valid month number (1-12)
    const rawReferenceMonth = value.consumption?.referenceMonth;
    let referenceMonth: number | undefined = undefined;
    if (typeof rawReferenceMonth === 'number') {
      referenceMonth = rawReferenceMonth || undefined;
    } else if (typeof rawReferenceMonth === 'string') {
      const month = this.months.find((m) => m.label === rawReferenceMonth);
      referenceMonth = month ? month.value : undefined;
    }

    // Build FormData with file and form fields
    const formData = new FormData();
    formData.append('billImage', billFile);
    formData.append('address', value.location?.address ?? '');
    formData.append('buildingType', value.building?.buildingType ?? '');
    formData.append('climateZone', value.building?.climateZone ?? this.climateZones[0] ?? '');

    // Add measuredAmountTnd if provided (will be overridden by extracted value if present)
    if (value.consumption?.measuredAmountTnd) {
      formData.append('measuredAmountTnd', value.consumption.measuredAmountTnd.toString());
    }

    // Add referenceMonth if provided (will be overridden by extracted value if present)
    if (referenceMonth) {
      formData.append('referenceMonth', referenceMonth.toString());
    }

    // Personal Info
    formData.append('fullName', value.personal?.fullName ?? '');
    formData.append('companyName', value.personal?.companyName ?? '');
    formData.append('email', value.personal?.email ?? '');
    formData.append('phoneNumber', value.personal?.phoneNumber ?? '');

    this.isSubmitting.set(true);

    this.auditService
      .createSimulationWithBill(formData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (result: IAuditSolaireSimulation) => {
          this.simulationResult.set(result);
          const resultStep = this.steps.find((s) => s.isResult);
          if (resultStep) {
            this.currentStep.set(resultStep.number);
          }
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation terminée',
            message: 'Les données de votre facture ont été extraites et la simulation a été créée.',
          });
          // Send PV report by email at the end (non-blocking)
          this.auditService.sendPVReportByEmail(result.id).subscribe({
            next: (emailRes) => {
              if (emailRes?.email) {
                this.notificationStore.addNotification({
                  type: 'success',
                  title: 'Rapport envoyé par email',
                  message: `Le rapport PV sera envoyé à ${emailRes.email}. Vérifiez votre boîte de réception.`,
                });
              }
            },
            error: () => {
              /* email optional */
            },
          });
        },
        error: (error) => {
          console.error('Error creating simulation with bill:', error);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message:
              error.error?.message ||
              "Une erreur est survenue lors de l'extraction des données de la facture ou de la création de la simulation.",
          });
        },
      });
  }

  protected downloadPVReport(): void {
    const result = this.simulationResult();
    if (!result?.id) {
      this.notificationStore.addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Aucune simulation trouvée. Veuillez d'abord compléter l'audit solaire.",
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
            message: 'Le rapport PV a été téléchargé.',
          });
        },
        error: () => {
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de générer le PDF. Veuillez réessayer.',
          });
        },
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
      message: 'Vous pouvez commencer une nouvelle simulation.',
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

  // ----- Chart helpers (monthly bills + cumulative gains vs CAPEX) – same logic as old audit-solaire -----

  protected getChartMaxValue(): number {
    const simulation = this.simulationResult();
    if (!simulation?.monthlyEconomics || simulation.monthlyEconomics.length === 0) {
      return 2000;
    }
    const maxBill = simulation.monthlyEconomics.reduce((max, m) => {
      return Math.max(max, m.billWithoutPV || 0, m.billWithPV || 0);
    }, 0);
    const { topTick } = this.getMonthlyBillsYAxisTicks(maxBill);
    return topTick;
  }

  protected getChartYAxisTicks(): number[] {
    const simulation = this.simulationResult();
    const maxBill =
      simulation?.monthlyEconomics?.reduce((max, m) => {
        return Math.max(max, m.billWithoutPV || 0, m.billWithPV || 0);
      }, 0) ?? 0;
    const { ticks } = this.getMonthlyBillsYAxisTicks(maxBill);
    return ticks;
  }

  private getMonthlyBillsYAxisTicks(maxValue: number): { topTick: number; ticks: number[] } {
    const tickCount = 5;
    const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1;
    const rawStep = safeMax / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const stepBase = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const step = stepBase * magnitude;
    const topTick = step * tickCount;
    const ticks = Array.from({ length: tickCount }, (_, i) => topTick - i * step);
    return { topTick, ticks };
  }

  protected getBarHeight(value: number): number {
    const maxValue = this.getChartMaxValue();
    if (maxValue === 0) return 0;
    return Math.min((value / maxValue) * 100, 100);
  }

  protected getMonthLabel(index: number): string {
    const months = [
      'Janv',
      'Févr',
      'Mars',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc',
    ];
    return months[index] ?? '';
  }

  protected onMonthlyBarHover(
    monthIndex: number,
    month: { billWithoutPV: number; billWithPV: number },
    bar: 'sans' | 'avec'
  ): void {
    this.monthlyBillsTooltip.set({
      monthIndex,
      monthLabel: this.getMonthLabel(monthIndex),
      billWithoutPV: month.billWithoutPV ?? 0,
      billWithPV: month.billWithPV ?? 0,
      bar,
    });
  }

  protected onMonthlyBarLeave(): void {
    this.monthlyBillsTooltip.set(null);
  }

  protected getChartYears(): number[] {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics) return [];
    return simulation.annualEconomics.map((e) => e.year).slice(0, 25);
  }

  protected getSparseChartYears(): number[] {
    return [1, 5, 10, 15, 20, 25];
  }

  protected getLineChartMaxValue(): number {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return 500000;
    const maxGain = Math.max(...simulation.annualEconomics.map((e) => e.cumulativeNetGain ?? 0));
    const capex = simulation.installationCost ?? 0;
    const maxValue = Math.max(maxGain, capex);
    const minGain = Math.min(...simulation.annualEconomics.map((e) => e.cumulativeNetGain ?? 0));
    const minValue = Math.min(minGain, capex);
    const { topTick } = this.calculateLineChartYAxisTicks(minValue, maxValue);
    return topTick;
  }

  protected getLineChartMinValue(): number {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return -50000;
    const minGain = Math.min(...simulation.annualEconomics.map((e) => e.cumulativeNetGain ?? 0));
    const capex = simulation.installationCost ?? 0;
    const minValue = Math.min(minGain, capex);
    const { bottomTick } = this.calculateLineChartYAxisTicks(minValue, Math.max(minValue, capex));
    return bottomTick;
  }

  protected getLineChartYAxisTicks(): number[] {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return [500000, 400000, 300000, 200000, 100000, 0];
    }
    const maxGain = Math.max(...simulation.annualEconomics.map((e) => e.cumulativeNetGain ?? 0));
    const capex = simulation.installationCost ?? 0;
    const maxValue = Math.max(maxGain, capex);
    const minGain = Math.min(...simulation.annualEconomics.map((e) => e.cumulativeNetGain ?? 0));
    const minValue = Math.min(minGain, capex);
    const { ticks } = this.calculateLineChartYAxisTicks(minValue, maxValue);
    return ticks;
  }

  private calculateLineChartYAxisTicks(
    minValue: number,
    maxValue: number
  ): { topTick: number; bottomTick: number; ticks: number[] } {
    const tickCount = 5;
    const range = maxValue - minValue;
    const safeRange = Number.isFinite(range) && range > 0 ? range : 1;
    const rawStep = safeRange / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const stepBase = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const step = stepBase * magnitude;
    const bottomTick = Math.floor(minValue / step) * step;
    const topTick = Math.ceil(maxValue / step) * step;
    const actualRange = topTick - bottomTick;
    const actualStep = actualRange / tickCount;
    const ticksAscending = Array.from(
      { length: tickCount + 1 },
      (_, i) => bottomTick + i * actualStep
    );
    return { topTick, bottomTick, ticks: ticksAscending.reverse() };
  }

  protected getGainsLinePoints(): string {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return '';
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return '';
    const years = this.getChartYears();
    if (years.length === 0) return '';
    return years
      .map((_, index) => {
        const data = simulation.annualEconomics[index];
        if (!data) return '';
        const value = data.cumulativeNetGain ?? 0;
        const x = years.length > 1 ? ((index / (years.length - 1)) * 1000).toFixed(2) : '500';
        const y = (400 - ((value - minValue) / range) * 400).toFixed(2);
        return `${x},${y}`;
      })
      .filter((p) => p !== '')
      .join(' ');
  }

  protected getGainsLinePointsArray(): Array<{ x: number; y: number }> {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return [];
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return [];
    const years = this.getChartYears();
    if (years.length === 0) return [];
    return years.map((_, index) => {
      const data = simulation.annualEconomics[index];
      if (!data) return { x: 0, y: 200 };
      const value = data.cumulativeNetGain ?? 0;
      const x = years.length > 1 ? (index / (years.length - 1)) * 1000 : 500;
      const y = 400 - ((value - minValue) / range) * 400;
      return { x, y };
    });
  }

  protected getCapexLinePoints(): string {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return '';
    const capex = simulation.installationCost ?? 0;
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return '';
    const years = this.getChartYears();
    if (years.length === 0) return '';
    return years
      .map((_, index) => {
        const x = years.length > 1 ? ((index / (years.length - 1)) * 1000).toFixed(2) : '500';
        const y = (400 - ((capex - minValue) / range) * 400).toFixed(2);
        return `${x},${y}`;
      })
      .join(' ');
  }

  protected getCapexLinePointsArray(): Array<{ x: number; y: number }> {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return [];
    const capex = simulation.installationCost ?? 0;
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return [];
    const years = this.getChartYears();
    if (years.length === 0) return [];
    return years.map((_, index) => {
      const x = years.length > 1 ? (index / (years.length - 1)) * 1000 : 500;
      const y = 400 - ((capex - minValue) / range) * 400;
      return { x, y };
    });
  }

  protected getGainsAreaPath(): string {
    const points = this.getGainsLinePointsArray();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map((p) => `${p.x},${p.y}`).join(' L ');
    return `M ${first.x},400 L ${line} L ${last.x},400 Z`;
  }

  protected getCapexAreaPath(): string {
    const points = this.getCapexLinePointsArray();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map((p) => `${p.x},${p.y}`).join(' L ');
    return `M ${first.x},400 L ${line} L ${last.x},400 Z`;
  }

  protected getIntersectionPoint(): { x: number; y: number; year: number; capex: number } | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return null;
    const capex = simulation.installationCost ?? 0;
    const years = this.getChartYears();
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return null;
    for (let i = 0; i < simulation.annualEconomics.length && i < years.length; i++) {
      const currentGain = simulation.annualEconomics[i].cumulativeNetGain ?? 0;
      const nextGain =
        i + 1 < simulation.annualEconomics.length
          ? simulation.annualEconomics[i + 1].cumulativeNetGain ?? 0
          : currentGain;
      if (currentGain <= capex && nextGain >= capex) {
        const year1 = years[i];
        const year2 = i + 1 < years.length ? years[i + 1] : year1;
        const ratio = (capex - currentGain) / (nextGain - currentGain);
        const exactYear = year1 + (year2 - year1) * ratio;
        const x = years.length > 1 ? ((i + ratio) / (years.length - 1)) * 1000 : 500;
        const y = 400 - ((capex - minValue) / range) * 400;
        return { x, y, year: exactYear, capex };
      }
    }
    return null;
  }

  protected getIntersectionBubbleWidth(): number {
    const point = this.getIntersectionPoint();
    if (!point) return 100;
    return this.calculateBubbleWidth(point.year.toFixed(1) + ' ans');
  }

  protected getIntersectionBubbleX(): number {
    const point = this.getIntersectionPoint();
    if (!point) return 0;
    return point.x - this.getIntersectionBubbleWidth() / 2;
  }

  protected getFinalGainsValue(): number | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return null;
    const year25Index = Math.min(24, simulation.annualEconomics.length - 1);
    return simulation.annualEconomics[year25Index]?.cumulativeNetGain ?? null;
  }

  protected getFinalGainsPoint(): { x: number; y: number } | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return null;
    const years = this.getChartYears();
    if (years.length === 0) return null;
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return null;
    const finalGain = this.getFinalGainsValue();
    if (finalGain === null) return null;
    const year25Index = Math.min(24, years.length - 1);
    const x = years.length > 1 ? (year25Index / (years.length - 1)) * 1000 : 500;
    const y = 400 - ((finalGain - minValue) / range) * 400;
    return { x, y };
  }

  protected getFinalGainsBubbleWidth(): number {
    const value = this.getFinalGainsValue();
    if (value === null) return 180;
    return this.calculateBubbleWidth(
      Math.round(value).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' DT'
    );
  }

  protected getFinalGainsBubbleX(): number {
    const point = this.getFinalGainsPoint();
    if (!point) return 0;
    const width = this.getFinalGainsBubbleWidth();
    return point.x - 210 - (width - 180) / 2;
  }

  protected getFinalGainsTextX(): number {
    const point = this.getFinalGainsPoint();
    if (!point) return 0;
    const width = this.getFinalGainsBubbleWidth();
    return this.getFinalGainsBubbleX() + width / 2;
  }

  protected getFinalCapexValue(): number | null {
    const simulation = this.simulationResult();
    return simulation ? simulation.installationCost ?? null : null;
  }

  protected getFinalCapexPoint(): { x: number; y: number } | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) return null;
    const years = this.getChartYears();
    if (years.length === 0) return null;
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return null;
    const capex = this.getFinalCapexValue();
    if (capex === null || capex === 0) return null;
    const year25Index = Math.min(24, years.length - 1);
    const x = years.length > 1 ? (year25Index / (years.length - 1)) * 1000 : 500;
    const y = 400 - ((capex - minValue) / range) * 400;
    return { x, y };
  }

  protected getFinalCapexBubbleWidth(): number {
    const value = this.getFinalCapexValue();
    if (value === null || value === 0) return 180;
    return this.calculateBubbleWidth(
      Math.round(value).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' DT'
    );
  }

  protected getFinalCapexBubbleX(): number {
    const point = this.getFinalCapexPoint();
    if (!point) return 0;
    const width = this.getFinalCapexBubbleWidth();
    return point.x - 210 - (width - 180) / 2;
  }

  protected getFinalCapexTextX(): number {
    const point = this.getFinalCapexPoint();
    if (!point) return 0;
    const width = this.getFinalCapexBubbleWidth();
    return this.getFinalCapexBubbleX() + width / 2;
  }

  private calculateBubbleWidth(text: string): number {
    const charWidth = 7;
    const padding = 30;
    return Math.max(80, text.length * charWidth + padding);
  }

  protected onChartMouseMove(event: MouseEvent): void {
    const svg = this.lineChartSvg?.nativeElement;
    const simulation = this.simulationResult();
    if (!svg || !simulation?.annualEconomics?.length) {
      this.chartTooltip.set(null);
      return;
    }
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      this.chartTooltip.set(null);
      return;
    }
    const svgP = pt.matrixTransform(ctm.inverse());
    const years = this.getChartYears();
    const n = years.length;
    if (n <= 0) {
      this.chartTooltip.set(null);
      return;
    }
    const rawIndex = (svgP.x / 1000) * (n - 1);
    const index = Math.max(0, Math.min(n - 1, Math.round(rawIndex)));
    const data = simulation.annualEconomics[index];
    const capex = simulation.installationCost ?? 0;
    if (!data) {
      this.chartTooltip.set(null);
      return;
    }
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range <= 0) {
      this.chartTooltip.set(null);
      return;
    }
    const gainsY = 400 - (((data.cumulativeNetGain ?? 0) - minValue) / range) * 400;
    const capexY = 400 - ((capex - minValue) / range) * 400;
    const distGains = Math.abs(svgP.y - gainsY);
    const distCapex = Math.abs(svgP.y - capexY);
    const curveHitRadius = 28;
    if (distGains > curveHitRadius && distCapex > curveHitRadius) {
      this.chartTooltip.set(null);
      return;
    }
    const midY = (gainsY + capexY) / 2;
    const bubblePt = svg.createSVGPoint();
    bubblePt.x = svgP.x;
    bubblePt.y = midY;
    const bubbleScreen = bubblePt.matrixTransform(ctm);
    const container = this.lineChartSvgContainer?.nativeElement;
    const containerRect = container?.getBoundingClientRect();
    const bubbleLocalX = containerRect ? bubbleScreen.x - containerRect.left : bubbleScreen.x;
    const bubbleLocalY = containerRect ? bubbleScreen.y - containerRect.top : bubbleScreen.y;
    this.chartTooltip.set({
      year: data.year,
      gains: data.cumulativeNetGain ?? 0,
      capex,
      bubbleLocalX,
      bubbleLocalY,
    });
  }

  protected onChartMouseLeave(): void {
    this.chartTooltip.set(null);
  }
}
