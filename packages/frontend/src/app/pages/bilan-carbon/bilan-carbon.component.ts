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
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
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
} from '@ng-icons/lucide';
import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { BilanCarbonFormService } from './bilan-carbon.form.service';
import {
  CarbonSimulatorService,
  CarbonFootprintSummaryPayload,
  CarbonFootprintSummaryResult,
} from '../../core/services/carbon-simulator.service';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';
import { NotificationStore } from '../../core/notifications/notification.store';
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

/** Category key for emissions by category */
export type EmissionCategoryKey =
  | 'energie_directe'
  | 'electricite'
  | 'deplacements'
  | 'equipements_it';

interface SimulatorStep {
  number: number;
  title: string;
  description: string;
  isResult: boolean;
}

interface CategoryShare {
  key: EmissionCategoryKey;
  label: string;
  pct: number;
}

const CLIMATE_ZONES = ['Nord', 'Centre', 'Sud'] as const;
type ClimateZone = (typeof CLIMATE_ZONES)[number];

const TARIFF_TYPES = ['BT', 'MT_UNIFORME', 'MT_HORAIRE'] as const;
type TariffType = (typeof TARIFF_TYPES)[number];

@Component({
  selector: 'app-bilan-carbon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NoGroupingPipe, UiSelectComponent],
  templateUrl: './bilan-carbon.component.html',
  styleUrl: './bilan-carbon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'aud-host' },
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
    }),
  ],
})
export class BilanCarbonComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly formService = inject(BilanCarbonFormService);
  private readonly carbonService = inject(CarbonSimulatorService);
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly form = this.formService.buildForm();
  protected readonly result = signal<CarbonFootprintSummaryResult | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly currentStep = signal(1);
  protected readonly contactConsent = signal(false);

  /** Ticks when form values change so stepProgress computed re-runs */
  private readonly formUpdateTrigger = signal(0);
  private formSubscription: { unsubscribe: () => void } | null = null;

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
  /** Month options with string values for native select (form stores string). */
  protected readonly monthOptionsForSelect = MONTH_OPTIONS.map((m) => ({
    value: String(m.value),
    label: m.label,
  }));

  protected readonly steps: SimulatorStep[] = [
    {
      number: 1,
      title: 'Secteur & informations générales',
      description: 'On situe votre site : secteur, taille, région.',
      isResult: false,
    },
    {
      number: 2,
      title: 'Électricité & équipements IT',
      description: "Votre facture d'électricité et le parc informatique.",
      isResult: false,
    },
    {
      number: 3,
      title: 'Chaleur, froid, véhicules & déplacements',
      description: 'Les postes hors électricité : combustion, climatisation, mobilité.',
      isResult: false,
    },
    {
      number: 4,
      title: 'Vos coordonnées',
      description: 'Optionnel — pour recevoir le récapitulatif de votre bilan.',
      isResult: false,
    },
    {
      number: 5,
      title: 'Résultats',
      description: '',
      isResult: true,
    },
  ];

  protected readonly lastFormStepNumber = 4;

  constructor() {
    effect(() => {
      const isResult = !!this.currentStepData().isResult;
      const hasResult = !!this.result();
      if (!isPlatformBrowser(this.platformId)) return;

      document.body.classList.toggle('aud-s4', isResult);
      if (!isResult) {
        document.body.classList.remove('aud-s4');
      }

      if (isResult && hasResult) {
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
      title: 'Bilan Carbone | JOYA Energy',
      description:
        "Calculez l'empreinte carbone de votre entreprise en Tunisie avec JOYA Energy. Identifiez vos sources d'émissions et découvrez comment réduire votre impact environnemental.",
      url: 'https://joya-energy.com/bilan-carbon',
      keywords:
        'bilan carbone Tunisie, empreinte carbone entreprise, calcul CO2 Tunisie, réduction émissions Tunisie, transition énergétique Tunisie',
    });

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.formUpdateTrigger.update((v) => v + 1);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.motion.scheduleRefresh();
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('aud-page', 'aud-s4');
    }
  }

  protected readonly stepProgress = computed(() => {
    this.formUpdateTrigger();
    const progress: Record<number, number> = {};
    const current = this.currentStep();

    const general = this.form.controls.general;
    const electricity = this.form.controls.electricity;

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

    for (let n = 3; n <= 4; n++) {
      progress[n] = current >= n ? 100 : 0;
    }

    return progress;
  });

  protected readonly overallProgress = computed(() => {
    const step = this.currentStep();
    if (step >= 5) return 100;
    return this.stepProgress()[step] ?? 0;
  });

  protected readonly currentStepData = computed(() => {
    return this.steps.find((s) => s.number === this.currentStep()) || this.steps[0];
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

  protected readonly hasHeatUsages = computed(() => {
    this.formUpdateTrigger();
    return this.form.controls.heat.controls.hasHeatUsages.value === true;
  });

  protected readonly hasCold = computed(() => {
    this.formUpdateTrigger();
    return this.form.controls.cold.controls.hasCold.value === true;
  });

  protected readonly hasVehicles = computed(() => {
    this.formUpdateTrigger();
    return this.form.controls.vehicles.controls.hasVehicles.value === true;
  });

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
    return true;
  }

  protected primaryActionLabel(): string {
    if (this.isSubmitting()) return 'Calcul en cours…';
    if (this.currentStep() === this.lastFormStepNumber) return 'Voir mon bilan';
    return 'Continuer';
  }

  protected previousStep(): void {
    if (this.currentStepData().isResult) {
      this.currentStep.set(this.lastFormStepNumber);
      return;
    }
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  protected nextStep(): void {
    const step = this.currentStep();

    if (step === this.lastFormStepNumber) {
      this.submitForm();
      return;
    }

    if (!this.canProceed()) {
      if (step === 1) {
        this.form.controls.general.markAllAsTouched();
      }
      if (step === 2) {
        this.form.controls.electricity.markAllAsTouched();
      }
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Étape incomplète',
        message: 'Veuillez remplir tous les champs obligatoires avant de continuer.',
      });
      return;
    }

    this.currentStep.update((s) => s + 1);
  }

  protected setYesNo(
    group: 'heat' | 'cold' | 'vehicles',
    control: 'hasHeatUsages' | 'hasCold' | 'hasVehicles',
    value: boolean
  ): void {
    if (group === 'heat' && control === 'hasHeatUsages') {
      this.form.controls.heat.controls.hasHeatUsages.setValue(value);
    } else if (group === 'cold' && control === 'hasCold') {
      this.form.controls.cold.controls.hasCold.setValue(value);
    } else if (group === 'vehicles' && control === 'hasVehicles') {
      this.form.controls.vehicles.controls.hasVehicles.setValue(value);
    }
    this.formUpdateTrigger.update((v) => v + 1);
  }

  protected onConsentChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.contactConsent.set(target.checked);
    }
  }

  protected setChipValue(path: string, value: string): void {
    this.form.get(path)?.setValue(value);
    this.formUpdateTrigger.update((v) => v + 1);
  }

  protected toggleHeatUsage(value: string): void {
    const control = this.form.controls.heat.controls.selectedHeatUsages;
    const current = [...(control.value ?? [])];
    const index = current.indexOf(value);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(value);
    }
    control.setValue(current);
    this.formUpdateTrigger.update((v) => v + 1);
  }

  protected isHeatUsageSelected(value: string): boolean {
    return (this.form.controls.heat.controls.selectedHeatUsages.value ?? []).includes(value);
  }

  protected submitForm(): void {
    this.submitError.set(null);

    if (!this.form.controls.general.valid || !this.form.controls.electricity.valid) {
      this.form.controls.general.markAllAsTouched();
      this.form.controls.electricity.markAllAsTouched();
      this.submitError.set('Veuillez remplir tous les champs obligatoires.');
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs obligatoires.',
      });
      this.currentStep.set(1);
      return;
    }

    const payload = this.buildPayload();
    this.isSubmitting.set(true);

    this.carbonService.calculateSummary(payload).subscribe({
      next: (res) => {
        this.result.set(res);
        this.isSubmitting.set(false);
        this.currentStep.set(5);
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        const message = err?.error?.message ?? 'Erreur lors du calcul. Veuillez réessayer.';
        this.submitError.set(message);
        this.isSubmitting.set(false);
        this.notificationStore.addNotification({
          type: 'error',
          title: 'Erreur',
          message,
        });
        this.cdr.markForCheck();
      },
    });
  }

  protected resetForm(): void {
    this.result.set(null);
    this.submitError.set(null);
    this.contactConsent.set(false);
    this.currentStep.set(1);
    this.form.reset(this.formService.buildForm().getRawValue());
    this.formUpdateTrigger.update((v) => v + 1);
  }

  /** Emissions per employee (tCO2e). */
  protected emissionsPerEmployee(r: CarbonFootprintSummaryResult): number {
    const n = this.form.controls.general.controls.numberOfEmployees.value ?? 0;
    if (n <= 0) return 0;
    return r.co2TotalTonnes / n;
  }

  /** Intensité = Totale / surface m² → kg CO₂e / m². */
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

  /** Bar width for scope fills (minimum readable width). */
  protected scopeBarWidth(scope: 1 | 2 | 3, r: CarbonFootprintSummaryResult): number {
    return Math.max(6, this.scopePct(scope, r));
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

  /** Highest-emitting category label for the detail table. */
  protected topEmitterLabel(r: CarbonFootprintSummaryResult): string {
    const cats: CategoryShare[] = [
      { key: 'energie_directe', label: 'Énergie directe', pct: this.categoryPct('energie_directe', r) },
      { key: 'electricite', label: 'Électricité', pct: this.categoryPct('electricite', r) },
      { key: 'deplacements', label: 'Déplacements & véhicules', pct: this.categoryPct('deplacements', r) },
      { key: 'equipements_it', label: 'Équipements IT', pct: this.categoryPct('equipements_it', r) },
    ];
    cats.sort((a, b) => b.pct - a.pct);
    const top = cats[0];
    if (!top || top.pct <= 0) return '—';
    return `${top.label} (${top.pct} %)`;
  }

  private isClimateZone(value: string): value is ClimateZone {
    return (CLIMATE_ZONES as readonly string[]).includes(value);
  }

  private isTariffType(value: string): value is TariffType {
    return (TARIFF_TYPES as readonly string[]).includes(value);
  }

  private buildPayload(): CarbonFootprintSummaryPayload {
    const g = this.form.controls.general.getRawValue();
    const e = this.form.controls.electricity.getRawValue();
    const h = this.form.controls.heat.getRawValue();
    const c = this.form.controls.cold.getRawValue();
    const v = this.form.controls.vehicles.getRawValue();
    const t = this.form.controls.travel.getRawValue();
    const it = this.form.controls.itEquipment.getRawValue();
    const p = this.form.controls.personal.getRawValue();

    const sector = g.sector ?? '';
    const zoneRaw = g.zone ?? 'Centre';
    const zone: ClimateZone = this.isClimateZone(zoneRaw) ? zoneRaw : 'Centre';
    const surfaceM2 = g.surfaceM2 ?? 0;
    const tariffRaw = e.tariffType ?? 'BT';
    const tariffType: TariffType = this.isTariffType(tariffRaw) ? tariffRaw : 'BT';

    return {
      electricity: {
        monthlyAmountDt: e.monthlyBillAmountDt ?? 0,
        referenceMonth: Number(e.referenceMonth) || 6,
        buildingType: sector,
        climateZone: zone,
        tariffType,
      },
      thermal: {
        hasHeatUsages: h.hasHeatUsages ?? false,
        annualElectricityKwh: 0,
        buildingType: sector,
        selectedHeatUsages: h.selectedHeatUsages ?? [],
        selectedHeatEnergies: h.selectedHeatEnergy ? [h.selectedHeatEnergy] : [],
      },
      cold: {
        hasCold: c.hasCold ?? false,
        surfaceM2,
        buildingType: sector,
        intensityLevel: c.intensity ?? 'Modérée',
        equipmentAge: c.equipmentAge ?? '3-7 ans',
        maintenanceStatus: c.maintenance ?? 'NSP',
      },
      vehicles: {
        hasVehicles: v.hasVehicles ?? false,
        numberOfVehicles: v.numberOfVehicles ?? 0,
        kmPerVehiclePerYear: v.kmPerVehiclePerYear ?? 0,
        usageType: v.usageType ?? 'Déplacements légers',
        fuelType: v.fuelType ?? 'Diesel',
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
