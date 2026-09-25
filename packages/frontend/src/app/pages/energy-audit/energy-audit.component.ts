import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
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

import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';

import { StepBuildingComponent } from './steps/step-building/step-building.component';
import { StepTechnicalComponent } from './steps/step-technical/step-technical.component';
import { StepEquipmentComponent } from './steps/step-equipment/step-equipment.component';
import { StepPersonalComponent } from './steps/step-personal/step-personal.component';

import { EnergyAuditFormService } from './services/energy-audit-form.service';
import { EnergyAuditService } from './services/energy-audit.service';
import { NotificationStore } from '../../core/notifications/notification.store';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';
import { EnergyAuditRequest, StepField } from './types/energy-audit.types';
import { AuditEnergetiqueResponse } from '../../core/services/audit-energetique.service';

@Component({
  selector: 'app-energy-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NoGroupingPipe,
    DatePipe,
    StepBuildingComponent,
    StepTechnicalComponent,
    StepEquipmentComponent,
    StepPersonalComponent,
  ],
  templateUrl: './energy-audit.component.html',
  styleUrls: ['./energy-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'aud-host' },
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
export class EnergyAuditComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly formService = inject(EnergyAuditFormService);
  private readonly auditService = inject(EnergyAuditService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly form = this.formService.buildForm();
  protected readonly steps = this.formService.getSteps();
  protected readonly buildingCategories = this.formService.buildingCategories;
  protected readonly buildingTypes = this.formService.buildingTypes;

  protected get formServiceInstance(): EnergyAuditFormService {
    return this.formService;
  }

  protected readonly currentStep = signal<number>(1);
  protected readonly isSubmitting = signal(false);
  protected readonly isGeneratingPDF = signal(false);
  protected readonly simulationResult = signal<AuditEnergetiqueResponse['data'] | null>(null);

  private readonly formUpdateTrigger = signal(0);

  /** Last form step (4). Result step is 5. */
  protected readonly lastFormStepNumber = (() => {
    const resultStep = this.steps.find((s) => s.isResult);
    return resultStep ? resultStep.number - 1 : this.steps.length - 1;
  })();

  protected readonly stepProgress = computed(() => {
    this.formUpdateTrigger();

    const progress: Record<number, number> = {};

    this.steps.forEach((step) => {
      if (step.isResult) {
        progress[step.number] = 0;
        return;
      }

      const stepFields = step.fields.filter((field) => this.isFieldVisible(field));

      const fieldsToCheck =
        step.number === 3
          ? [...stepFields, { name: 'hasExistingMeasures', required: true } as StepField]
          : stepFields;

      if (fieldsToCheck.length === 0) {
        progress[step.number] = 0;
        return;
      }

      const filledFields = fieldsToCheck.filter((field) => {
        const control = this.form.get(field.name);
        if (!control) return false;
        const value = control.value;

        const isFilled =
          value !== null &&
          value !== '' &&
          value !== undefined &&
          (Array.isArray(value) ? value.length > 0 : true);

        const isValid = control.valid;

        return isFilled && isValid;
      });

      progress[step.number] = Math.round((filledFields.length / fieldsToCheck.length) * 100);
    });

    return progress;
  });

  protected readonly currentStepData = computed(() => {
    return this.steps.find((s) => s.number === this.currentStep()) || this.steps[0];
  });

  protected readonly overallProgress = computed(() => {
    const current = this.currentStepData();
    if (current.isResult) return 100;
    return this.stepProgress()[current.number];
  });

  /** Progress bar fill for handoff `.aud__ptrack > i`. */
  protected readonly audProgressPct = computed(() => {
    const total = Math.max(this.steps.length, 1);
    if (this.currentStepData().isResult) return 100;
    const completedBefore = this.currentStep() - 1;
    const withinStep = this.overallProgress() / 100;
    const denom = Math.max(total - 1, 1);
    return Math.min(100, Math.round(((completedBefore + withinStep) / denom) * 100));
  });

  protected readonly canProceed = computed(() => {
    const step = this.currentStepData();
    if (step.isResult) return false;
    return this.stepProgress()[step.number] === 100;
  });

  protected readonly canGoBack = computed(() => this.currentStep() > 1);

  constructor() {
    effect(() => {
      const isResult = !!this.currentStepData().isResult;
      const hasSimulation = !!this.simulationResult();
      if (!isPlatformBrowser(this.platformId)) return;

      document.body.classList.toggle('aud-s4', isResult);
      if (!isResult) {
        document.body.classList.remove('aud-s4');
      }

      if (isResult && hasSimulation) {
        window.setTimeout(() => {
          this.motion.scheduleRefresh(40);
          document.getElementById('rpt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('aud-page');
    }

    this.seoService.setSEO({
      title: 'Audit énergétique pour entreprises | Joya Energy',
      description:
        'Analysez la consommation et la performance énergétique de votre entreprise avec Joya Energy.',
      url: 'https://joya-energy.com/audit-energetique',
      keywords:
        'audit énergétique, efficacité énergétique, performance énergétique, consommation énergétique, Tunisie',
    });

    this.form.valueChanges.subscribe(() => {
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control) {
          control.updateValueAndValidity({ emitEvent: false });
        }
      });

      this.formUpdateTrigger.update((v) => v + 1);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.motion.scheduleRefresh();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('aud-page', 'aud-s4');
    }
  }

  protected isFieldVisible(field: StepField): boolean {
    if (!field.condition) return true;
    return field.condition(this.form.value);
  }

  protected isStepClickable(stepNumber: number): boolean {
    const step = this.steps.find((s) => s.number === stepNumber);
    if (!step || step.isResult) return false;
    return stepNumber < this.currentStep();
  }

  protected goToStep(stepNumber: number): void {
    if (!this.isStepClickable(stepNumber)) return;
    if (stepNumber < this.currentStep()) {
      this.currentStep.set(stepNumber);
    }
  }

  protected nextStep(): void {
    if (!this.canProceed()) {
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

    if (this.currentStep() === this.lastFormStepNumber) {
      this.submitForm();
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
        error: () => {
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

    this.auditService.downloadPDF(result.simulationId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-audit-energetique-${result.simulationId.substring(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isGeneratingPDF.set(false);

        this.notificationStore.addNotification({
          type: 'success',
          title: 'PDF téléchargé',
          message: 'Le rapport PDF a été téléchargé avec succès.',
        });
      },
      error: (error: { error?: { error?: string }; message?: string }) => {
        this.isGeneratingPDF.set(false);

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

    const hasRecentBill = false;

    return {
      fullName: formValue.fullName || '',
      companyName: formValue.companyName || '',
      email: formValue.email || '',
      phoneNumber: formValue.phoneNumber || '',
      address: formValue.address || '',
      governorate: formValue.governorate || '',

      buildingType: formValue.buildingType || '',
      surfaceArea: formValue.surfaceArea || 0,
      floors: formValue.floors || 0,
      activityType: formValue.activityType || '',
      climateZone: formValue.climateZone || '',

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

      tariffType: formValue.tariffType || '',
      contractedPower: undefined,
      monthlyBillAmount: formValue.monthlyBillAmount || 0,
      hasRecentBill: hasRecentBill,
      recentBillConsumption: undefined,
      billAttachmentUrl: undefined,
    };
  }
}
