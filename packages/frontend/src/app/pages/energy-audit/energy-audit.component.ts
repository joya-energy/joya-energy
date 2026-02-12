import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { finalize } from 'rxjs/operators';
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
  lucideMapPin,
  lucideBox,
  lucideDrumstick,
  lucideGraduationCap,
  lucideHammer,
  lucideHotel,
  lucidePill,
  lucideSnowflake,
  lucideSparkles,
  lucideStethoscope,
  lucideShirt,
  lucideUtensilsCrossed,
  lucideCalendar,
} from '@ng-icons/lucide';

// Base Components
import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';

// Step Components
import { StepBuildingComponent } from './steps/step-building/step-building.component';
import { StepTechnicalComponent } from './steps/step-technical/step-technical.component';
import { StepEquipmentComponent } from './steps/step-equipment/step-equipment.component';
import { StepPersonalComponent } from './steps/step-personal/step-personal.component';

// Services and Types
import { EnergyAuditFormService } from './services/energy-audit-form.service';
import { EnergyAuditService } from './services/energy-audit.service';
import { NotificationStore } from '../../core/notifications/notification.store';
import { SEOService } from '../../core/services/seo.service';
import { SimulatorStep, StepField, EnergyAuditRequest } from './types/energy-audit.types';
import { AuditEnergetiqueResponse } from '../../core/services/audit-energetique.service';

@Component({
  selector: 'app-energy-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    NoGroupingPipe,
    UiStepTimelineComponent,
    UiProgressBarComponent,
    DatePipe,
    StepBuildingComponent,
    StepTechnicalComponent,
    StepEquipmentComponent,
    StepPersonalComponent,
  ],
  templateUrl: './energy-audit.component.html',
  styleUrls: ['./energy-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Step transition animation - simple fade and slide
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' })),
      ]),
    ]),
    // Result cards fade in - simple fade and slide up
    trigger('resultCards', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
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
      lucideMapPin,
      lucideBox,
      lucideDrumstick,
      lucideGraduationCap,
      lucideHammer,
      lucideHotel,
      lucidePill,
      lucideSnowflake,
      lucideSparkles,
      lucideStethoscope,
      lucideShirt,
      lucideUtensilsCrossed,
      lucideCalendar,
    }),
  ],
})
export class EnergyAuditComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private readonly formService = inject(EnergyAuditFormService);
  private auditService = inject(EnergyAuditService);
  private notificationStore = inject(NotificationStore);
  private seoService = inject(SEOService);
  private cdr = inject(ChangeDetectorRef);

  protected readonly form = this.formService.buildForm();
  protected readonly steps = this.formService.getSteps();
  protected readonly buildingCategories = this.formService.buildingCategories;
  protected readonly buildingTypes = this.formService.buildingTypes;

  // Expose formService for template access
  protected get formServiceInstance() {
    return this.formService;
  }

  protected readonly currentStep = signal<number>(1);
  protected readonly isSubmitting = signal(false);
  protected readonly isGeneratingPDF = signal(false);
  protected readonly simulationResult = signal<AuditEnergetiqueResponse['data'] | null>(null);

  // Force recomputation signal - updates when form changes
  private readonly formUpdateTrigger = signal(0);

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Audit Énergétique | JOYA Energy',
      description: 'Analyse complète de votre consommation, de vos usages et de votre facture énergétique en Tunisie pour identifier les leviers d\'optimisation les plus pertinents.',
      url: 'https://joya-energy.com/audit-energetique',
      keywords: 'audit énergétique Tunisie, diagnostic énergétique Tunisie, analyse consommation énergie Tunisie, optimisation énergétique Tunisie, Tunisia',
    });
    // Subscribe to form value changes to trigger progress updates
    this.form.valueChanges.subscribe(() => {
      // Update validity for all controls
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control) {
          control.updateValueAndValidity({ emitEvent: false });
        }
      });

      // Trigger recomputation of progress
      this.formUpdateTrigger.update((v) => v + 1);

      // Force change detection to update progress bars
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {}

  // Calculate progress for each step - based on all fields being filled AND valid
  protected readonly stepProgress = computed(() => {
    // Access trigger to recompute when form changes
    this.formUpdateTrigger();

    const progress: Record<number, number> = {};
    const formValue = this.form.value;

    this.steps.forEach((step) => {
      if (step.isResult) {
        progress[step.number] = 0;
        return;
      }

      // Get visible fields for this step
      const stepFields = step.fields.filter((field) => this.isFieldVisible(field));

      // For step 3 (equipment), also include hasExistingMeasures
      const fieldsToCheck =
        step.number === 3
          ? [...stepFields, { name: 'hasExistingMeasures', required: true } as StepField]
          : stepFields;

      if (fieldsToCheck.length === 0) {
        progress[step.number] = 0;
        return;
      }

      // Count filled AND valid fields (progress only increases when fields are valid)
      const filledFields = fieldsToCheck.filter((field) => {
        const control = this.form.get(field.name);
        if (!control) return false;
        const value = control.value;

        // Check if value is filled
        const isFilled =
          value !== null &&
          value !== '' &&
          value !== undefined &&
          (Array.isArray(value) ? value.length > 0 : true);

        // Check if control is valid (no validation errors)
        const isValid = control.valid;

        // Both filled and valid required for progress
        return isFilled && isValid;
      });

      progress[step.number] = Math.round((filledFields.length / fieldsToCheck.length) * 100);
    });

    return progress;
  });

  // Get current step data
  protected readonly currentStepData = computed(() => {
    return this.steps.find((s) => s.number === this.currentStep()) || this.steps[0];
  });

  // Calculate overall progress - only for current step
  protected readonly overallProgress = computed(() => {
    const current = this.currentStepData();
    if (current.isResult) return 0;

    return this.stepProgress()[current.number];
  });

  // Check if we can proceed to next step - requires 100% completion
  protected readonly canProceed = computed(() => {
    const step = this.currentStepData();
    if (step.isResult) return false;

    // Check if current step is 100% complete
    return this.stepProgress()[step.number] === 100;
  });

  // Check if previous button should be enabled
  protected readonly canGoBack = computed(() => {
    return this.currentStep() > 1;
  });

  /** Last form step (4). Result step is 5. */
  protected readonly lastFormStepNumber = (() => {
    const resultStep = this.steps.find((s) => s.isResult);
    return resultStep ? resultStep.number - 1 : this.steps.length - 1;
  })();

  // Check if a step is clickable in sidebar - ONLY allows going back
  protected isStepClickable(stepNumber: number): boolean {
    const step = this.steps.find((s) => s.number === stepNumber);
    if (!step) return false;

    // Result step is never clickable
    if (step.isResult) {
      return false;
    }

    const current = this.currentStep();

    // Can only go back to previous steps (not forward, not current)
    return stepNumber < current;
  }

  protected isFieldVisible(field: StepField): boolean {
    if (!field.condition) return true;
    return field.condition(this.form.value);
  }

  protected nextStep(): void {
    if (!this.canProceed()) {
      // Mark current step fields as touched to show validation errors
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
    if (!this.isStepClickable(stepNumber)) {
      return;
    }

    const current = this.currentStep();

    // Can only go back to previous steps
    if (stepNumber < current) {
      this.currentStep.set(stepNumber);
    }
  }

  protected submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs obligatoires.',
      });
      return;
    }

    const payload = this.buildPayload();
    this.isSubmitting.set(true);

    this.auditService
      .createSimulation(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: AuditEnergetiqueResponse) => {
          this.simulationResult.set(response.data);
          const resultStep = this.steps.find((s) => s.isResult);
          if (resultStep) {
            this.currentStep.set(resultStep.number);
          }
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation terminée',
            message: 'Voici les résultats de votre audit.',
          });
          // Send report by email at the end (non-blocking)
          this.auditService.generateAndSendPDF(response.data.simulationId).subscribe({
            next: (emailRes) => {
              if (emailRes?.email) {
                this.notificationStore.addNotification({
                  type: 'success',
                  title: 'Rapport envoyé par email',
                  message: `Le rapport a été envoyé à ${emailRes.email}. Vérifiez votre boîte de réception.`,
                });
              }
            },
            error: () => {
              /* email optional; user already has result */
            },
          });
        },
        error: (error) => {
          console.error(error);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de créer la simulation. Vérifiez les informations saisies.',
          });
        },
      });
  }

  protected downloadPDF(): void {
    const result = this.simulationResult();
    if (!result?.simulationId) {
      this.notificationStore.addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Aucune simulation trouvée. Veuillez d'abord compléter l'audit.",
      });
      return;
    }

    this.isGeneratingPDF.set(true);

    // First, download the PDF directly
    this.auditService.downloadPDF(result.simulationId).subscribe({
      next: (blob: Blob) => {
        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-audit-energetique-${result.simulationId.substring(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isGeneratingPDF.set(false);

        // Note: Email is sent automatically after calculation completes, not on PDF download
        // This prevents duplicate emails when users download the PDF
        this.notificationStore.addNotification({
          type: 'success',
          title: 'PDF téléchargé',
          message: 'Le rapport PDF a été téléchargé avec succès.',
        });
      },
      error: (error) => {
        this.isGeneratingPDF.set(false);
        console.error('Error downloading PDF:', error);

        // Extract error message from response if available
        let errorMessage = 'Impossible de générer le PDF. Veuillez réessayer.';
        if (error?.error?.error) {
          errorMessage = error.error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.notificationStore.addNotification({
          type: 'error',
          title: 'Erreur',
          message: errorMessage,
        });
      },
    });
  }

  protected resetForm(): void {
    this.form.reset();
    this.simulationResult.set(null);
    this.currentStep.set(1);
    this.notificationStore.addNotification({
      type: 'info',
      title: 'Formulaire réinitialisé',
      message: 'Vous pouvez commencer une nouvelle simulation.',
    });
  }

  private buildPayload(): EnergyAuditRequest {
    const formValue = this.form.getRawValue();

    // COMMENTED OUT: Since we removed recentBillConsumption field, set hasRecentBill to false
    // to avoid backend validation errors. Backend requires recentBillConsumption when hasRecentBill is true.
    // const hasRecentBill = formValue.monthlyBillAmount !== null &&
    //                      formValue.monthlyBillAmount !== undefined &&
    //                      formValue.monthlyBillAmount > 0;
    const hasRecentBill = false; // Set to false since we removed recentBillConsumption field

    return {
      // Personal
      fullName: formValue.fullName || '',
      companyName: formValue.companyName || '',
      email: formValue.email || '',
      phoneNumber: formValue.phoneNumber || '',
      address: formValue.address || '',
      governorate: formValue.governorate || '',

      // Building
      buildingType: formValue.buildingType || '',
      surfaceArea: formValue.surfaceArea || 0,
      floors: formValue.floors || 0,
      activityType: formValue.activityType || '',
      climateZone: formValue.climateZone || '',

      // Technical
      openingDaysPerWeek: formValue.openingDaysPerWeek || 0,
      openingHoursPerDay: formValue.openingHoursPerDay || 0,
      insulation: formValue.insulation || '',
      glazingType: formValue.glazingType || '',
      ventilation: formValue.ventilation || '',
      heatingSystem: formValue.heatingSystem || '',
      coolingSystem: formValue.coolingSystem || '',
      conditionedCoverage: formValue.conditionedCoverage || '',
      domesticHotWater: formValue.domesticHotWater || '',
      equipmentCategories: Array.isArray(formValue.equipmentCategories)
        ? formValue.equipmentCategories
        : [],
      existingMeasures:
        formValue.hasExistingMeasures === true &&
        Array.isArray(formValue.existingMeasures) &&
        formValue.existingMeasures.length > 0
          ? formValue.existingMeasures
          : [],
      lightingType: formValue.lightingType || '',

      // Consumption
      tariffType: formValue.tariffType || '',
      // COMMENTED OUT: contractedPower field removed from UI
      // contractedPower: formValue.contractedPower && formValue.contractedPower > 0 ? formValue.contractedPower : undefined,
      contractedPower: undefined, // Field removed - send undefined
      monthlyBillAmount: formValue.monthlyBillAmount || 0,
      hasRecentBill: hasRecentBill, // Set to false since recentBillConsumption field was removed
      // COMMENTED OUT: recentBillConsumption field removed from UI
      // recentBillConsumption: hasRecentBill && formValue.recentBillConsumption ? formValue.recentBillConsumption : undefined,
      recentBillConsumption: undefined, // Field removed - send undefined (backend will accept this when hasRecentBill is false)
      billAttachmentUrl: undefined,
      // COMMENTED OUT: referenceMonth is not sent to backend yet - will be integrated in future
      // referenceMonth: formValue.referenceMonth
    };
  }
}
