import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  lucideArrowRight,
  lucideArrowLeft,
  lucideBuilding2,
  lucideUtensilsCrossed,
  lucideHotel,
  lucideStethoscope,
  lucideHammer,
  lucideDrumstick,
  lucideBox,
  lucideShirt,
  lucideFactory,
  lucideSnowflake,
  lucideFlame,
  lucideUsers,
  lucideActivity,
  lucideLeaf,
  lucideTrendingUp,
  lucideZap,
  lucideGlobe,
} from '@ng-icons/lucide';
import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { BilanCarbonFormService } from './bilan-carbon.form.service';
import { CarbonSimulatorService } from '../../core/services/carbon-simulator.service';
import { SEOService } from '../../core/services/seo.service';
import {
  SECTOR_CARD_CONFIG,
  ZONE_OPTIONS,
  GOVERNORATE_OPTIONS,
  TARIFF_OPTIONS,
  MONTH_OPTIONS,
  HEAT_USAGE_OPTIONS,
  HEAT_ENERGY_OPTIONS,
  INTENSITY_OPTIONS,
  AGE_OPTIONS,
  MAINTENANCE_OPTIONS,
  FUEL_OPTIONS,
  VEHICLE_USAGE_OPTIONS,
  TRAVEL_FREQUENCY_OPTIONS,
} from './bilan-carbon.types';
import type { CarbonFootprintSummaryResult } from '../../core/services/carbon-simulator.service';

/** Category key for emissions by category */
export type EmissionCategoryKey =
  | 'energie_directe'
  | 'electricite'
  | 'deplacements'
  | 'equipements_it';

interface SimulatorStep {
  number: number;
  title: string;
  description?: string;
  isResult: boolean;
}

@Component({
  selector: 'app-bilan-carbon',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    NoGroupingPipe,
    UiStepTimelineComponent,
    UiProgressBarComponent,
    UiSelectComponent,
    UiInputComponent,
  ],
  templateUrl: './bilan-carbon.component.html',
  styleUrl: './bilan-carbon.component.scss',
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
      lucideArrowRight,
      lucideArrowLeft,
      lucideBuilding2,
      lucideUtensilsCrossed,
      lucideHotel,
      lucideStethoscope,
      lucideHammer,
      lucideDrumstick,
      lucideBox,
      lucideShirt,
      lucideFactory,
      lucideSnowflake,
      lucideFlame,
      lucideUsers,
      lucideActivity,
      lucideLeaf,
      lucideTrendingUp,
      lucideZap,
      lucideGlobe,
    }),
  ],
})
export class BilanCarbonComponent implements OnInit, OnDestroy {
  private formService = inject(BilanCarbonFormService);
  private carbonService = inject(CarbonSimulatorService);
  private seoService = inject(SEOService);

  protected form = this.formService.buildForm();
  protected result = signal<CarbonFootprintSummaryResult | null>(null);
  protected loading = signal(false);
  protected isSubmitting = signal(false);
  protected submitError = signal<string | null>(null);
  protected currentStep = signal(1);

  /** Ticks when form values change so stepProgress computed re-runs */
  private formUpdateTrigger = signal(0);
  private formSubscription: { unsubscribe: () => void } | null = null;

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Bilan Carbone | JOYA Energy',
      description: 'Calculez l\'empreinte carbone de votre entreprise en Tunisie avec JOYA Energy. Identifiez vos sources d\'émissions et découvrez comment réduire votre impact environnemental.',
      url: 'https://joya-energy.com/bilan-carbon',
      keywords: 'bilan carbone Tunisie, empreinte carbone entreprise, calcul CO2 Tunisie, réduction émissions Tunisie, transition énergétique Tunisie',
    });

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.formUpdateTrigger.update((v) => v + 1);
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  protected readonly sectorCards = SECTOR_CARD_CONFIG;
  /** Sector options adapted for ui-select dropdown-icon variant (with icons). */
  protected readonly sectorOptionsForSelect = SECTOR_CARD_CONFIG.map((card) => ({
    value: card.id,
    label: card.label,
    icon: card.icon,
  }));
  protected readonly zoneOptions = ZONE_OPTIONS;
  protected readonly governorateOptions = GOVERNORATE_OPTIONS;
  protected readonly tariffOptions = TARIFF_OPTIONS;
  protected readonly heatUsageOptions = HEAT_USAGE_OPTIONS;
  protected readonly heatEnergyOptions = HEAT_ENERGY_OPTIONS;
  protected readonly intensityOptions = INTENSITY_OPTIONS;
  protected readonly ageOptions = AGE_OPTIONS;
  protected readonly maintenanceOptions = MAINTENANCE_OPTIONS;
  protected readonly fuelOptions = FUEL_OPTIONS;
  protected readonly vehicleUsageOptions = VEHICLE_USAGE_OPTIONS;
  protected readonly travelFrequencyOptions = TRAVEL_FREQUENCY_OPTIONS;

  /** Month options with string values for ui-select (expects SelectOption.value: string) */
  protected readonly monthOptionsForSelect = MONTH_OPTIONS.map((m) => ({
    value: String(m.value),
    label: m.label,
  }));

  protected readonly steps: SimulatorStep[] = [
    { number: 1, title: 'Secteur & Informations générales', isResult: false },
    { number: 2, title: 'Électricité & Équipements IT', isResult: false },
    { number: 3, title: 'Chaleur, Climatisation, Véhicules & Déplacements', isResult: false },
    { number: 4, title: 'Informations personnelles (optionnel)', isResult: false },
    { number: 5, title: 'Résultats', isResult: true },
  ];

  protected readonly lastFormStepNumber = 4;

  protected stepProgress = computed(() => {
    this.formUpdateTrigger(); // Re-run when form changes
    const progress: Record<number, number> = {};
    const current = this.currentStep();

    const general = this.form.controls.general;
    const electricity = this.form.controls.electricity;

    // Step 1: Sector & General
    if (current > 1) {
      progress[1] = 100;
    } else if (current === 1) {
      const step1Required = ['sector', 'zone', 'referenceYear', 'surfaceM2', 'numberOfEmployees'];
      const step1Filled = step1Required.filter((key) => {
        const control = general.get(key);
        const val = control?.value;
        return val !== null && val !== '' && val !== undefined;
      }).length;
      progress[1] = Math.round((step1Filled / step1Required.length) * 100);
    } else {
      progress[1] = 0;
    }

    // Step 2: Electricity (required) + IT optional
    if (current > 2) {
      progress[2] = 100;
    } else if (current === 2) {
      const step2Required = ['monthlyBillAmountDt', 'referenceMonth'];
      const step2Filled = step2Required.filter((key) => {
        const control = electricity.get(key);
        const val = control?.value;
        return val !== null && val !== '' && val !== undefined;
      }).length;
      progress[2] = Math.round((step2Filled / step2Required.length) * 100);
    } else {
      progress[2] = 0;
    }

    // Steps 3–4: optional — 100% when reached or past, 0% before
    for (let n = 3; n <= 4; n++) {
      progress[n] = current > n ? 100 : current === n ? 100 : 0;
    }

    return progress;
  });

  /** Overall progress = current step's progress (0–100) */
  protected overallProgress = computed(() => {
    const step = this.currentStep();
    if (step >= 5) return 100; // results
    return this.stepProgress()[step] ?? 0;
  });

  protected currentStepData = computed(() => {
    return this.steps.find((s) => s.number === this.currentStep()) || this.steps[0];
  });

  protected canGoBack(): boolean {
    return this.currentStep() > 1 && !this.currentStepData().isResult;
  }

  protected canProceed(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      return (
        this.form.controls.general.controls.sector.valid &&
        this.form.controls.general.controls.zone.valid &&
        this.form.controls.general.controls.referenceYear.valid &&
        this.form.controls.general.controls.surfaceM2.valid &&
        this.form.controls.general.controls.numberOfEmployees.valid
      );
    }
    if (step === 2) {
      return this.form.controls.electricity.valid;
    }
    // Steps 3-6 are optional
    return true;
  }

  protected isStepClickable(stepNumber: number): boolean {
    if (stepNumber === this.currentStep()) return true;
    if (this.currentStepData().isResult) return stepNumber < this.currentStep();
    return stepNumber < this.currentStep();
  }

  protected goToStep(stepNumber: number): void {
    if (this.isStepClickable(stepNumber) && !this.steps[stepNumber - 1].isResult) {
      this.currentStep.set(stepNumber);
    }
  }

  protected previousStep(): void {
    if (this.canGoBack()) {
      this.currentStep.update((s) => s - 1);
    }
  }

  protected nextStep(): void {
    const step = this.currentStep();

    if (step === this.lastFormStepNumber) {
      // Last form step -> submit
      this.submitForm();
    } else if (this.canProceed()) {
      this.currentStep.update((s) => s + 1);
    }
  }

  protected selectSector(id: string): void {
    this.form.controls.general.controls.sector.setValue(id);
  }

  protected submitForm(): void {
    this.submitError.set(null);

    // Validate required fields
    if (!this.form.controls.general.valid || !this.form.controls.electricity.valid) {
      this.submitError.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const payload = this.buildPayload();
    this.isSubmitting.set(true);
    this.loading.set(true);

    this.carbonService.calculateSummary(payload).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
        this.isSubmitting.set(false);
        this.currentStep.set(5); // Go to results
      },
      error: (err) => {
        this.submitError.set(err?.error?.message ?? 'Erreur lors du calcul. Veuillez réessayer.');
        this.loading.set(false);
        this.isSubmitting.set(false);
      },
    });
  }

  protected resetForm(): void {
    this.result.set(null);
    this.submitError.set(null);
    this.currentStep.set(1);
    this.form.reset(this.formService.buildForm().value);
  }

  /** Emissions per employee (tCO2e). Uses form value for number of employees. */
  protected emissionsPerEmployee(r: CarbonFootprintSummaryResult): number {
    const n = this.form.controls.general.controls.numberOfEmployees.value ?? 0;
    if (n <= 0) return 0;
    return r.co2TotalTonnes / n;
  }

  /** Intensité = Totale / surface m² → kg CO₂e / m². Uses form value for surface. */
  protected intensity(r: CarbonFootprintSummaryResult): number {
    const surfaceM2 = this.form.controls.general.controls.surfaceM2.value ?? 0;
    if (surfaceM2 <= 0) return 0;
    return r.co2TotalKg / surfaceM2;
  }

  /** Scope share in % of total (0–100). */
  protected scopePct(scope: 1 | 2 | 3, r: CarbonFootprintSummaryResult): number {
    const total = r.co2TotalTonnes;
    if (total <= 0) return 0;
    const t = scope === 1 ? r.co2Scope1Tonnes : scope === 2 ? r.co2Scope2Tonnes : r.co2Scope3Tonnes;
    return Math.round((t / total) * 100);
  }

  /** Category share in % (0–100). */
  protected categoryPct(category: EmissionCategoryKey, r: CarbonFootprintSummaryResult): number {
    const total = r.co2TotalTonnes;
    if (total <= 0) return category === 'electricite' ? 100 : 0;

    const t = this.form.controls.travel.getRawValue();
    const it = this.form.controls.itEquipment.getRawValue();
    const hasTravel = !!(t?.planeFrequency || t?.trainFrequency);
    const hasIT =
      (it?.laptopCount ?? 0) +
        (it?.desktopCount ?? 0) +
        (it?.screenCount ?? 0) +
        (it?.proPhoneCount ?? 0) >
      0;

    const scope1Share = r.co2Scope1Tonnes / total;
    const scope2Share = r.co2Scope2Tonnes / total;
    const scope3Share = r.co2Scope3Tonnes / total;
    const scope3Travel =
      !hasTravel && !hasIT ? 0 : hasTravel && !hasIT ? 1 : !hasTravel && hasIT ? 0 : 0.5;
    const scope3IT =
      !hasTravel && !hasIT ? 0 : !hasTravel && hasIT ? 1 : hasTravel && !hasIT ? 0 : 0.5;

    if (category === 'energie_directe') return Math.round(scope1Share * 100);
    if (category === 'electricite') return Math.round(scope2Share * 100);
    if (category === 'deplacements') return Math.round(scope3Share * scope3Travel * 100);
    if (category === 'equipements_it') return Math.round(scope3Share * scope3IT * 100);
    return 0;
  }

  private buildPayload(): Parameters<CarbonSimulatorService['calculateSummary']>[0] {
    const g = this.form.controls.general.getRawValue();
    const e = this.form.controls.electricity.getRawValue();
    const h = this.form.controls.heat.getRawValue();
    const c = this.form.controls.cold.getRawValue();
    const v = this.form.controls.vehicles.getRawValue();
    const t = this.form.controls.travel.getRawValue();
    const it = this.form.controls.itEquipment.getRawValue();
    const p = this.form.controls.personal.getRawValue();

    const sector = g.sector ?? '';
    const zone = g.zone ?? 'Centre';
    const surfaceM2 = g.surfaceM2 ?? 0;

    return {
      electricity: {
        monthlyAmountDt: e.monthlyBillAmountDt ?? 0,
        referenceMonth: Number(e.referenceMonth) || 6,
        buildingType: sector as never,
        climateZone: zone as 'Nord' | 'Centre' | 'Sud',
        tariffType: (e.tariffType ?? 'BT') as 'BT' | 'MT_UNIFORME' | 'MT_HORAIRE',
      },
      thermal: {
        hasHeatUsages: h.hasHeatUsages ?? false,
        annualElectricityKwh: 0,
        buildingType: sector as never,
        selectedHeatUsages: (h.selectedHeatUsages ?? []) as (
          | 'DOMESTIC_HOT_WATER'
          | 'COOKING_KITCHEN'
          | 'INDUSTRIAL_PROCESS'
          | 'SPACE_HEATING'
        )[],
        selectedHeatEnergies: (h.selectedHeatEnergy ? [h.selectedHeatEnergy] : []) as (
          | 'NATURAL_GAS'
          | 'DIESEL_FUEL'
          | 'LPG'
        )[],
      },
      cold: {
        hasCold: c.hasCold ?? false,
        surfaceM2,
        buildingType: sector as never,
        intensityLevel: (c.intensity ?? 'Modérée') as 'Faible' | 'Modérée' | 'Élevée',
        equipmentAge: (c.equipmentAge ?? '3-7 ans') as '<3 ans' | '3-7 ans' | '>7 ans' | 'NSP',
        maintenanceStatus: (c.maintenance ?? 'NSP') as 'Oui' | 'Non' | 'NSP',
      },
      vehicles: {
        hasVehicles: v.hasVehicles ?? false,
        numberOfVehicles: v.numberOfVehicles ?? 0,
        kmPerVehiclePerYear: v.kmPerVehiclePerYear ?? 0,
        usageType: (v.usageType ?? 'Déplacements légers') as never,
        fuelType: (v.fuelType ?? 'Diesel') as never,
      },
      scope3: {
        travel: {
          planeFrequency: t.planeFrequency ?? undefined,
          trainFrequency: t.trainFrequency ?? undefined,
        },
        itEquipment: {
          laptopCount: it.laptopCount ?? 0,
          desktopCount: it.desktopCount ?? 0,
          screenCount: it.screenCount ?? 0,
          proPhoneCount: it.proPhoneCount ?? 0,
        },
      },
      personal: {
        fullName: p.fullName || undefined,
        companyName: p.companyName || undefined,
        email: p.email || undefined,
        phone: p.phone || undefined,
      },
    };
  }
}
