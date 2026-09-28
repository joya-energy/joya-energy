import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  AfterViewInit,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideBuilding2,
} from '@ng-icons/lucide';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BillExtractionService } from '../../core/services/bill-extraction.service';

import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import {
  GoogleMapsInputComponent,
  AddressData,
} from '../../shared/components/google-maps-input/google-maps-input.component';
import { UploadCardConfig } from '../../shared/components/upload-card';
import { UiBillExtractorComponent } from '../../shared/components/ui-bill-extractor/ui-bill-extractor.component';

// Services and Types
import { NotificationStore } from '../../core/notifications/notification.store';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';
import {
  AuditSolaireService,
  CreateSimulationPayload,
} from '../../core/services/audit-solaire.service';
import { AuditSolaireFormService } from '../audit-solaire/audit-solaire.form.service';
import { IAuditSolaireSimulation } from '@shared/interfaces';
import { BuildingTypes, ClimateZones } from '@shared';
import { BillExtractionStore } from '../../core/stores/bill-extraction.store';
import { AnalyseFactureService } from '../../core/services/analyse-facture.service';
import { AnalyseFactureStore } from '../../core/stores/analyse-facture.store';
import { LeadService } from '../../core/services/lead.service';
import { mapStegAnalyseResponse } from '../../core/utils/analyse-facture.mapper';
import { isStegAnalyseResponseEmpty } from '@shared/functions/analyse-facture-validation';
import { convertPdfFileToImageFile, isPdfFile } from '../../core/utils/pdf-bill-image.util';
import {
  extractSolarAuditFields,
  extractPersonalInfoFields,
} from '../../core/utils/bill-extraction.utils';
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

const STEP_1_FIELDS: StepField[] = [
  {
    name: 'consumption.hasInvoice',
    label: 'Avez-vous une facture photo ?',
    type: 'select',
    required: true,
  } as StepField,
  {
    name: 'consumption.measuredAmountTnd',
    label: 'Montant mensuel (TND)',
    type: 'number',
    required: true,
    condition: (value) => value?.consumption?.hasInvoice === 'no',
  } as StepField,
  {
    name: 'consumption.referenceMonth',
    label: 'Mois de référence',
    type: 'select',
    required: true,
    condition: (value) => value?.consumption?.hasInvoice === 'no',
  } as StepField,
  {
    name: 'consumption.tariffTension',
    label: 'Régime tarifaire',
    type: 'select',
    required: true,
  } as StepField,
];

const PERSONAL_INFO_FIELDS: StepField[] = [
  { name: 'personal.fullName', label: 'Nom complet', type: 'text', required: true },
  { name: 'personal.companyName', label: 'Entreprise', type: 'text', required: true },
  { name: 'personal.email', label: 'Email', type: 'text', required: true },
  { name: 'personal.phoneNumber', label: 'Téléphone', type: 'text', required: true },
  { name: 'location.address', label: 'Adresse complète du bâtiment', type: 'text', required: true },
];

const BILL_ANALYSIS_PERSONAL_FIELDS: StepField[] = [
  { name: 'personal.fullName', label: 'Nom complet', type: 'text', required: true },
  { name: 'personal.email', label: 'Email', type: 'text', required: true },
  { name: 'personal.phoneNumber', label: 'Téléphone', type: 'text', required: true },
];

const FULL_AUDIT_STEPS: SimulatorStep[] = [
  {
    number: 1,
    title: "Facture et consommation d’électricité",
    description: "Indiquez le montant de votre facture mensuelle d’électricité.",
    fields: STEP_1_FIELDS,
  },
  {
    number: 2,
    title: "Bâtiment et profil d’activité",
    description: 'Précisez le type de bâtiment et sa zone climatique.',
    fields: [
      { name: 'building.buildingType', label: 'Type de bâtiment', type: 'select', required: true },
      { name: 'building.climateZone', label: 'Zone climatique', type: 'select', required: true },
    ],
  },
  {
    number: 3,
    title: 'Informations personnelles et localisation',
    description: 'Indiquez l’adresse exacte de votre site pour estimer l’ensoleillement.',
    fields: PERSONAL_INFO_FIELDS,
  },
  {
    number: 4,
    title: 'Résultats de simulation et potentiel solaire',
    description: 'Analyse technique et économique de votre installation solaire.',
    fields: [],
    isResult: true,
  },
];

const BILL_ANALYSIS_STEP_1_FIELDS: StepField[] = STEP_1_FIELDS.map((field) =>
  field.name === 'consumption.hasInvoice'
    ? ({ ...field, label: 'Insérer une facture photo' } as StepField)
    : field
);

const BILL_ANALYSIS_STEPS: SimulatorStep[] = [
  {
    number: 1,
    title: 'Facture',
    description: '',
    fields: BILL_ANALYSIS_STEP_1_FIELDS,
  },
  {
    number: 2,
    title: 'Informations personnelles',
    description: 'Vos coordonnées pour recevoir les résultats de l’analyse.',
    fields: BILL_ANALYSIS_PERSONAL_FIELDS,
  },
  {
    number: 3,
    title: 'Résultats',
    description: 'Analyse de votre facture STEG.',
    fields: [],
    isResult: true,
  },
];

@Component({
  selector: 'app-solar-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NoGroupingPipe,
    UiSelectComponent,
    GoogleMapsInputComponent,
    UiBillExtractorComponent,
    DatePipe,
  ],
  templateUrl: './solar-audit.component.html',
  styleUrls: ['./solar-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'aud-host' },
  providers: [
    provideIcons({
      ...BUILDING_ICON_REGISTRY,
      lucideArrowRight,
      lucideArrowLeft,
      lucideBuilding2,
    }),
  ],
})
export class SolarAuditComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly formService = inject(AuditSolaireFormService);
  private readonly auditService = inject(AuditSolaireService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly seoService = inject(SEOService);
  private readonly motion = inject(HandoffMotionService);
  protected readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly billExtractionStore = inject(BillExtractionStore);
  private readonly billExtractionService = inject(BillExtractionService);
  private readonly analyseFactureService = inject(AnalyseFactureService);
  private readonly analyseFactureStore = inject(AnalyseFactureStore);
  private readonly leadService = inject(LeadService);

  protected readonly isBillAnalysisMode = signal(false);

  // Wizard steps depend on route: full audit vs bill analysis only
  protected readonly steps = computed(() =>
    this.isBillAnalysisMode() ? BILL_ANALYSIS_STEPS : FULL_AUDIT_STEPS
  );

  // Surplus sale tariff (injection) used for MT surplus revenue calculations (DT/kWh)
  protected readonly surplusBuybackTariffDtPerKwh = 0.08;

  // Reuse existing typed form from old solar simulator
  protected readonly form: FormGroup = this.formService.buildForm();

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
    { label: 'Oui', value: 'yes' },
    { label: 'Non', value: 'no' },
  ];

  // Signal for invoice choice - tracks form value changes reactively
  private readonly hasInvoiceValue = signal<'yes' | 'no' | null>('yes');
  
  protected readonly hasInvoice = computed(() => {
    return this.hasInvoiceValue() === 'yes';
  });

  // Helper getters for MT / BT selection (used in template conditions & logic)
  protected get isMediumTensionSelected(): boolean {
    return this.form.get('consumption.tariffTension')?.value === 'MT';
  }

  @ViewChild('mtOptionsContainer') private mtOptionsContainer?: ElementRef<HTMLElement>;

  protected readonly billFileSelected = signal(false);
  protected readonly billFile = signal<File | null>(null);

  protected readonly buildingTypeCards: BuildingTypeCard[] = BUILDING_CARD_CONFIG;
  /** Building type options adapted for ui-select dropdown-icon variant (with icons). */
  protected readonly buildingTypeOptionsForSelect = BUILDING_CARD_CONFIG.map((card) => ({
    value: card.id,
    label: card.label,
    icon: card.icon,
  }));
  protected readonly uploadCardConfig: UploadCardConfig = {
    title: "Téléchargez votre facture d’électricité",
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

  /** BT: annual savings = annualBillWithoutPV - annualBillWithPV */
  protected readonly btAnnualSavings = computed(() => {
    const s = this.simulationResult();
    if (!s) return null;
    const withoutPV = s.annualBillWithoutPV ?? null;
    const withPV = s.annualBillWithPV ?? null;
    if (withoutPV == null || withPV == null) return null;
    return withoutPV - withPV;
  });

  /**
   * Value displayed in "Économies annuelles".
   * - MT: Eco_annuel = F_sans - F_avec + Vente_exc
   * - BT: F_sans - F_avec
   */
  protected readonly annualSavingsForDisplay = computed(() => {
    const s = this.simulationResult();
    if (!s) return null;

    // MT: Eco_brute,1 = Eco_annuel = F_sans - F_avec + Vente_exc
    if (s.mtAnnualBillWithPVApprox != null && s.annualBillWithoutPV != null) {
      const venteExc = (s.mtGridSurplus ?? 0) * this.surplusBuybackTariffDtPerKwh;
      return s.annualBillWithoutPV - s.mtAnnualBillWithPVApprox + venteExc;
    }

    // Backend may already store Eco_annuel for MT
    if (s.mtSelfConsumedEnergy != null && s.annualSavings != null) {
      return s.annualSavings;
    }

    return this.btAnnualSavings();
  });

  /**
   * Value displayed in "Après" (annual bill with PV).
   * - MT: use backend-provided `mtAnnualBillWithPVApprox` when present (bill after self-consumption)
   * - Otherwise: use backend `annualBillWithPV` (BT baseline)
   */
  protected readonly annualBillWithPVForDisplay = computed(() => {
    const s = this.simulationResult();
    if (!s) return null;
    if (s.mtAnnualBillWithPVApprox != null) return s.mtAnnualBillWithPVApprox;
    return s.annualBillWithPV ?? null;
  });

  /**
   * "Après" = F_avec.
   * Do not use Avant - Eco_annuel for MT: Eco includes Vente_exc.
   */
  protected readonly annualBillAfterEquationForDisplay = computed(() => {
    const withPv = this.annualBillWithPVForDisplay();
    if (withPv != null) return Math.max(0, Math.round(withPv));

    const s = this.simulationResult();
    if (!s) return null;
    const before = s.annualBillWithoutPV ?? null;
    const savings = this.annualSavingsForDisplay();
    if (before == null || savings == null) return null;
    return Math.max(0, Math.round(before) - Math.round(savings));
  });

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

  // Force recomputation when form changes
  private readonly formUpdateTrigger = signal(0);

  // Progress per step
  protected readonly stepProgress = computed(() => {
    this.formUpdateTrigger();
    this.billFileSelected();

    const progress: Record<number, number> = {};
    const formValue = this.form.value;

    this.steps().forEach((step) => {
      if (step.isResult) {
        progress[step.number] = 0;
        return;
      }

      if (step.number === 1 && this.isBillAnalysisMode()) {
        progress[step.number] = this.billFileSelected() ? 100 : 0;
        return;
      }

      // Special handling for step 1: when hasInvoice === 'yes', we need to count
      // measuredAmountTnd and referenceMonth even though they’re not visible (auto-populated)
      let fieldsToCount: StepField[] = [];
      if (step.number === 1) {
        const hasInvoice = this.form.get('consumption.hasInvoice')?.value === 'yes';
        if (hasInvoice) {
          // When hasInvoice === 'yes', count all fields including hidden ones that are auto-populated
          fieldsToCount = step.fields;
        } else {
          // When hasInvoice === 'no', only count visible fields
          fieldsToCount = step.fields.filter((field) => this.isFieldVisible(field));
        }
      } else {
        // For other steps, only count visible fields
        fieldsToCount = step.fields.filter((field) => this.isFieldVisible(field));
      }

      if (fieldsToCount.length === 0) {
        progress[step.number] = 0;
        return;
      }

      const filledFields = fieldsToCount.filter((field) => {
        const control = this.form.get(field.name);
        if (!control) return false;

        const value = control.value;
        if (field.name === 'consumption.referenceMonth') {
          return this.isReferenceMonthFilled(value);
        }

        // Check if value is actually filled (not empty object, empty string, null, undefined)
        const isFilled =
          value !== null &&
          value !== '' &&
          value !== undefined &&
          !(typeof value === 'object' && Object.keys(value).length === 0);
        const isValid = control.valid;
        return isFilled && isValid;
      });

      progress[step.number] = Math.round((filledFields.length / fieldsToCount.length) * 100);
    });

    return progress;
  });

  protected readonly currentStepData = computed(() => {
    const activeSteps = this.steps();
    return activeSteps.find((s) => s.number === this.currentStep()) || activeSteps[0];
  });

  protected readonly overallProgress = computed(() => {
    const current = this.currentStepData();
    if (current.isResult) return 100;
    return this.stepProgress()[current.number];
  });

  /** Progress bar fill for handoff `.aud__ptrack > i` (step index + in-step fill). */
  protected readonly audProgressPct = computed(() => {
    const steps = this.steps();
    const total = Math.max(steps.length, 1);
    if (this.currentStepData().isResult) return 100;
    const completedBefore = this.currentStep() - 1;
    const withinStep = this.overallProgress() / 100;
    const denom = Math.max(total - 1, 1);
    return Math.min(100, Math.round(((completedBefore + withinStep) / denom) * 100));
  });

  /** Facture reduction % for cmpx banner. */
  protected readonly savingsPctForDisplay = computed(() => {
    const simulation = this.simulationResult();
    const savings = this.annualSavingsForDisplay();
    if (!simulation || savings == null || !simulation.annualBillWithoutPV) return null;
    return Math.round((savings / simulation.annualBillWithoutPV) * 100);
  });

  protected readonly canProceed = computed(() => {
    const step = this.currentStepData();
    if (step.isResult) return false;
    return this.stepProgress()[step.number] === 100;
  });

  protected readonly canGoBack = computed(() => this.currentStep() > 1);

  protected primaryActionDisabled(): boolean {
    // Only block while a request is in flight. Incomplete steps stay clickable so
    // nextStep() can surface a clear validation toast instead of a dead control.
    return this.isSubmitting();
  }

  protected primaryActionLabel(): string {
    if (this.isSubmitting()) {
      return this.isBillAnalysisMode() ? 'Analyse en cours...' : 'Calcul en cours...';
    }
    if (this.isBillAnalysisMode() && this.currentStep() === this.lastFormStepNumber()) {
      return "Lancer l’analyse";
    }
    return 'Lancer la simulation';
  }

  protected readonly lastFormStepNumber = computed(() => (this.isBillAnalysisMode() ? 2 : 3));

  constructor() {
    effect(() => {
      const isResult = !!this.currentStepData().isResult;
      // Also depend on simulation so we re-wire after results paint
      const hasSimulation = !!this.simulationResult();
      if (!isPlatformBrowser(this.platformId)) return;

      document.body.classList.toggle('aud-s4', isResult);
      if (!isResult) {
        document.body.classList.remove('aud-s4');
      }

      if (isResult && hasSimulation) {
        // Wait for report DOM, then scrub scroll + run .rp-anim reveals
        window.setTimeout(() => {
          this.motion.scheduleRefresh(40);
          document.getElementById('rpt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    });
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

  /** Accepts numeric 1–12 or legacy month labels used by older UI bindings. */
  private isReferenceMonthFilled(value: number | string | null | undefined): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 1 && value <= 12;
    }
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 12) return true;
    return this.months.some((m) => m.label === value);
  }

  /** Coerce legacy label / string month values to 1–12 so validators stay green. */
  private normalizeReferenceMonthControl(): void {
    const control = this.form.get('consumption.referenceMonth');
    if (!control) return;
    const value = control.value;
    if (value === null || value === undefined || value === '') return;

    if (typeof value === 'number' && value >= 1 && value <= 12) return;

    if (typeof value === 'string') {
      const asNumber = Number(value);
      if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 12) {
        control.setValue(asNumber, { emitEvent: false });
        return;
      }
      const month = this.months.find((m) => m.label === value);
      if (month) {
        control.setValue(month.value, { emitEvent: false });
      }
    }
  }

  protected isStepClickable(stepNumber: number): boolean {
    const step = this.steps().find((s) => s.number === stepNumber);
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
    if (
      (!this.isBillAnalysisMode() && stepNumber === 3) ||
      (this.isBillAnalysisMode() && stepNumber === 2)
    ) {
      this.autoPopulatePersonalInfoFromBillExtraction();
    }
  }

  private validateBillUploadStep(): boolean {
    const extractedData = this.billExtractionStore.getExtractedData();
    const solarAuditFields = extractSolarAuditFields(extractedData);

    if (!solarAuditFields) {
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Extraction incomplète',
        message: this.isBillAnalysisMode()
          ? 'Veuillez télécharger et extraire votre facture avant de continuer.'
          : 'Veuillez télécharger et extraire votre facture, ou choisissez de saisir manuellement.',
      });
      return false;
    }

    const measuredAmountControl = this.form.get('consumption.measuredAmountTnd');
    const referenceMonthControl = this.form.get('consumption.referenceMonth');
    const tariffTensionControl = this.form.get('consumption.tariffTension');
    const tariffRegimeControl = this.form.get('consumption.tariffRegime');
    const operatingHoursCaseControl = this.form.get('consumption.operatingHoursCase');

    if (
      !measuredAmountControl?.value ||
      !referenceMonthControl?.value ||
      !tariffTensionControl?.value
    ) {
      this.autoPopulateFromBillExtraction();
      if (
        !measuredAmountControl?.value ||
        !referenceMonthControl?.value ||
        !tariffTensionControl?.value
      ) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Extraction incomplète',
          message: this.isBillAnalysisMode()
            ? 'Impossible d\'extraire toutes les informations nécessaires. Veuillez réessayer.'
            : 'Impossible d\'extraire toutes les informations nécessaires. Veuillez réessayer ou saisir manuellement.',
        });
        return false;
      }
    }

    if (tariffTensionControl?.value === 'MT') {
      if (!tariffRegimeControl?.value || !operatingHoursCaseControl?.value) {
        this.autoPopulateFromBillExtraction();
        if (!tariffRegimeControl?.value || !operatingHoursCaseControl?.value) {
          this.notificationStore.addNotification({
            type: 'warning',
            title: 'Informations MT manquantes',
            message: this.isBillAnalysisMode()
              ? 'Impossible d\'extraire les informations tarifaires MT. Veuillez réessayer avec une autre facture.'
              : 'Veuillez sélectionner le régime tarifaire (uniforme/horaire) et l\'horaire de fonctionnement pour les tarifs MT.',
          });
          if (!this.isBillAnalysisMode()) {
            tariffRegimeControl?.markAsTouched();
            operatingHoursCaseControl?.markAsTouched();
          }
          return false;
        }
      }
    }

    return true;
  }

  private validateFullAuditStep1(): boolean {
    const hasInvoiceControl = this.form.get('consumption.hasInvoice');
    if (!hasInvoiceControl?.value || hasInvoiceControl.invalid) {
      hasInvoiceControl?.markAsTouched();
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Sélection requise',
        message: 'Veuillez indiquer si vous avez une facture photo ou non.',
      });
      return false;
    }

    if (hasInvoiceControl.value === 'yes') {
      return this.validateBillUploadStep();
    }

    const measuredAmountControl = this.form.get('consumption.measuredAmountTnd');
    const referenceMonthControl = this.form.get('consumption.referenceMonth');
    const tariffTensionControl = this.form.get('consumption.tariffTension');
    const tariffRegimeControl = this.form.get('consumption.tariffRegime');
    const operatingHoursCaseControl = this.form.get('consumption.operatingHoursCase');

    if (
      !measuredAmountControl?.value ||
      !this.isReferenceMonthFilled(referenceMonthControl?.value) ||
      !tariffTensionControl?.value ||
      measuredAmountControl.invalid
    ) {
      this.normalizeReferenceMonthControl();
      measuredAmountControl?.markAsTouched();
      referenceMonthControl?.markAsTouched();
      tariffTensionControl?.markAsTouched();
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Informations manquantes',
        message:
          'Veuillez saisir votre montant mensuel, le mois de référence et le régime tarifaire.',
      });
      return false;
    }

    if (tariffTensionControl.value === 'MT') {
      if (!tariffRegimeControl?.value || !operatingHoursCaseControl?.value) {
        tariffRegimeControl?.markAsTouched();
        operatingHoursCaseControl?.markAsTouched();
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Informations MT manquantes',
          message:
            'Veuillez sélectionner le régime tarifaire (uniforme/horaire) et l\'horaire de fonctionnement pour les tarifs MT.',
        });
        return false;
      }
    }

    return true;
  }

  protected nextStep(): void {
    const stepNumber = this.currentStep();

    if (stepNumber === 1 && this.isBillAnalysisMode()) {
      if (!this.billFileSelected()) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Facture requise',
          message: 'Veuillez télécharger votre facture avant de continuer.',
        });
        return;
      }
      this.goForwardFrom(stepNumber);
      return;
    }

    if (stepNumber === 1) {
      if (!this.validateFullAuditStep1()) {
        return;
      }
      // Advance directly after step-1 validation — do not re-gate on canProceed/stepProgress
      this.goForwardFrom(stepNumber);
      return;
    }

    if (stepNumber === 2 && !this.isBillAnalysisMode()) {
      if (!this.validateFullAuditStep2()) {
        return;
      }
      this.goForwardFrom(stepNumber);
      return;
    }

    // Contact / last form step — validate then submit or advance
    if (stepNumber === this.lastFormStepNumber()) {
      this.normalizeReferenceMonthControl();
      this.formUpdateTrigger.update((v) => v + 1);
      if (!this.canProceed()) {
        const currentStep = this.currentStepData();
        currentStep.fields.forEach((field) => {
          this.form.get(field.name)?.markAsTouched();
        });
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Étape incomplète',
          message: 'Veuillez remplir tous les champs avant de continuer.',
        });
        return;
      }
      this.goForwardFrom(stepNumber);
      return;
    }

    this.finishNextStep(stepNumber);
  }

  /** Move to next step or submit — no progress-percent gate. */
  private goForwardFrom(stepNumber: number): void {
    this.normalizeReferenceMonthControl();
    this.formUpdateTrigger.update((v) => v + 1);

    const lastFormStep = this.lastFormStepNumber();
    const next = stepNumber + 1;
    if (next <= lastFormStep) {
      this.currentStep.set(next);
      if (
        (!this.isBillAnalysisMode() && next === 3) ||
        (this.isBillAnalysisMode() && next === 2)
      ) {
        this.autoPopulatePersonalInfoFromBillExtraction();
      }
      this.cdr.markForCheck();
      return;
    }

    if (stepNumber === lastFormStep) {
      if (this.isBillAnalysisMode()) {
        this.runBillAnalysisFlow();
        return;
      }
      this.submitForm();
    }
  }

  private validateFullAuditStep2(): boolean {
    const buildingType = this.form.get('building.buildingType');
    const climateZone = this.form.get('building.climateZone');
    const typeValue = buildingType?.value;
    const isTypeValid = typeof typeValue === 'string' && typeValue.trim().length > 0;
    const isZoneValid = typeof climateZone?.value === 'string' && climateZone.value.trim().length > 0;

    if (!isTypeValid || !isZoneValid) {
      buildingType?.markAsTouched();
      climateZone?.markAsTouched();
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Informations manquantes',
        message: 'Veuillez sélectionner le type de bâtiment et la zone climatique.',
      });
      return false;
    }
    return true;
  }

  private runBillAnalysisFlow(): void {
    if (!this.canProceed()) {
      const currentStep = this.currentStepData();
      currentStep.fields.forEach((field) => {
        this.form.get(field.name)?.markAsTouched();
      });

      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Étape incomplète',
        message: 'Veuillez remplir tous les champs avant de continuer.',
      });
      return;
    }

    const file = this.billFile();
    if (!file) {
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Facture requise',
        message: 'Veuillez télécharger votre facture avant de lancer l\'analyse.',
      });
      return;
    }

    this.collectBillAnalysisLead();
    this.prepareSkippedStepsDefaults();
    this.analyseFactureStore.clear();
    this.isSubmitting.set(true);
    this.analyseFactureStore.setAnalyzing(true);

    void this.submitBillAnalysis(file);
  }

  private async submitBillAnalysis(file: File): Promise<void> {
    let billFile = file;
    if (isPdfFile(file)) {
      try {
        billFile = await convertPdfFileToImageFile(file);
      } catch {
        // Fallback: backend converts PDF server-side (pdf-to-png-converter).
        billFile = file;
      }
    }

    const formData = new FormData();
    formData.append('billImage', billFile);

    this.analyseFactureService
      .analyzeBill(formData)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.analyseFactureStore.setAnalyzing(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            if (isStegAnalyseResponseEmpty(response.data)) {
              const message =
                'Impossible de lire cette facture. Essayez une photo JPG/PNG de la facture, ou un autre export PDF.';
              this.analyseFactureStore.setError(message);
              this.notificationStore.addNotification({
                type: 'error',
                title: 'Facture illisible',
                message,
              });
              return;
            }

            const mapped = mapStegAnalyseResponse(response.data);
            this.analyseFactureStore.setResult(mapped);
            void this.router.navigate(['/analyse-facture/resultats'], {
              queryParams: mapped.tariffType === 'MT' ? { type: 'MT' } : {},
            });
            return;
          }

          this.notificationStore.addNotification({
            type: 'error',
            title: 'Analyse impossible',
            message: 'La réponse du serveur est invalide. Veuillez réessayer.',
          });
        },
        error: (err: { error?: { message?: string }; message?: string; status?: number }) => {
          const backendMessage = err?.error?.message ?? err?.message;
          const isQuota =
            err?.status === 429 ||
            (backendMessage?.toLowerCase().includes('quota') ?? false) ||
            (backendMessage?.includes('429') ?? false);

          const message = isQuota
            ? 'Le quota du service d\'analyse est dépassé. Contactez l\'administrateur ou réessayez plus tard.'
            : backendMessage ||
              'Impossible d\'analyser votre facture pour le moment. Réessayez dans quelques instants.';

          this.analyseFactureStore.setError(message);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Analyse impossible',
            message,
          });
        },
      });
  }

  protected onBillFileChange(file: File | null): void {
    this.billFile.set(file);
    this.billFileSelected.set(!!file);
  }

  private finishNextStep(stepNumber: number): void {
    this.normalizeReferenceMonthControl();
    this.formUpdateTrigger.update((v) => v + 1);

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

    const lastFormStep = this.lastFormStepNumber();
    const next = stepNumber + 1;
    if (next <= lastFormStep) {
      this.currentStep.set(next);
      if (
        (!this.isBillAnalysisMode() && next === 3) ||
        (this.isBillAnalysisMode() && next === 2)
      ) {
        this.autoPopulatePersonalInfoFromBillExtraction();
      }
      return;
    }

    if (stepNumber === lastFormStep) {
      if (this.isBillAnalysisMode()) {
        this.runBillAnalysisFlow();
        return;
      }
      this.submitForm();
    }
  }

  protected previousStep(): void {
    const prev = this.currentStep() - 1;
    if (prev >= 1) {
      this.currentStep.set(prev);
    }
  }

  private collectBillAnalysisLead(): void {
    const personal = this.form.get('personal')?.getRawValue() as {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
    } | null;

    if (!personal?.email?.trim()) {
      return;
    }

    this.leadService
      .createLead({
        email: personal.email.trim(),
        phoneNumber: personal.phoneNumber?.trim(),
        name: personal.fullName?.trim(),
        source: 'analyse-facture',
      })
      .subscribe({
        error: () => {
          // Non-blocking: lead collection must not block the bill analysis
        },
      });
  }

  private prepareSkippedStepsDefaults(): void {
    this.autoPopulatePersonalInfoFromBillExtraction();

    const buildingTypeControl = this.form.get('building.buildingType');
    const buildingValue = buildingTypeControl?.value;
    if (
      !buildingValue ||
      (typeof buildingValue === 'object' && Object.keys(buildingValue).length === 0)
    ) {
      buildingTypeControl?.setValue(BuildingTypes.OFFICE_ADMIN_BANK, { emitEvent: false });
    }

    const climateZoneControl = this.form.get('building.climateZone');
    const climateValue = climateZoneControl?.value;
    if (
      !climateValue ||
      (typeof climateValue === 'object' && Object.keys(climateValue).length === 0)
    ) {
      climateZoneControl?.setValue(ClimateZones.CENTER, { emitEvent: false });
    }

    const fallbackValues: Record<string, string> = {
      'personal.fullName': 'Non renseigné',
      'personal.companyName': 'Non renseigné',
      'personal.email': 'non-renseigne@joya-energy.com',
      'personal.phoneNumber': '00000000',
      'location.address': 'Tunisie',
    };

    for (const [path, value] of Object.entries(fallbackValues)) {
      const control = this.form.get(path);
      if (control && !control.value) {
        control.setValue(value, { emitEvent: false });
      }
    }

    const skippedPaths = [
      'building.buildingType',
      'building.climateZone',
      'personal.fullName',
      'personal.companyName',
      'personal.email',
      'personal.phoneNumber',
      'location.address',
    ];

    for (const path of skippedPaths) {
      const control = this.form.get(path);
      control?.clearValidators();
      control?.updateValueAndValidity({ emitEvent: false });
    }
  }


  /**
   * Auto-populate form fields from bill extraction store if available
   * Extracts: measuredAmountTnd, referenceMonth, tariffTension
   * This method will populate fields even if they have values (for bill extraction flow)
   */
  private autoPopulateFromBillExtraction(): void {
    const extractedData = this.billExtractionStore.getExtractedData();
    if (!extractedData) {
      return;
    }

    const solarAuditFields = extractSolarAuditFields(extractedData);
    if (!solarAuditFields) {
      return;
    }

    // Populate fields (allow overwriting for bill extraction flow)
    const measuredAmountControl = this.form.get('consumption.measuredAmountTnd');
    if (measuredAmountControl) {
      measuredAmountControl.setValue(solarAuditFields.measuredAmountTnd, {
        emitEvent: true,
      });
    }

    const referenceMonthControl = this.form.get('consumption.referenceMonth');
    if (referenceMonthControl) {
      const monthOption = this.months.find(
        (m) => m.value === solarAuditFields.referenceMonth
      );
      if (monthOption) {
        // Always store the numeric month (1–12) so Validators.min/max stay valid
        referenceMonthControl.setValue(monthOption.value, { emitEvent: true });
      }
    }

    const tariffTensionControl = this.form.get('consumption.tariffTension');
    if (tariffTensionControl) {
      tariffTensionControl.setValue(solarAuditFields.tariffTension, {
        emitEvent: true,
      });
    }

    // Populate tariffRegime and operatingHoursCase for MT bills
    if (solarAuditFields.tariffTension === 'MT') {
      const tariffRegimeControl = this.form.get('consumption.tariffRegime');
      if (tariffRegimeControl && solarAuditFields.tariffRegime) {
        tariffRegimeControl.setValue(solarAuditFields.tariffRegime, {
          emitEvent: true,
        });
      }

      const operatingHoursCaseControl = this.form.get('consumption.operatingHoursCase');
      if (operatingHoursCaseControl && solarAuditFields.operatingHoursCase) {
        operatingHoursCaseControl.setValue(solarAuditFields.operatingHoursCase, {
          emitEvent: true,
        });
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Auto-populate personal information and location fields from bill extraction store if available
   * Extracts: clientName (for fullName/companyName), address
   * Note: Email and phone are not available in bill extraction data
   * Only populates fields that are currently empty (doesn’t overwrite user input)
   */
  private autoPopulatePersonalInfoFromBillExtraction(): void {
    const extractedData = this.billExtractionStore.getExtractedData();
    if (!extractedData) {
      return;
    }

    const personalInfoFields = extractPersonalInfoFields(extractedData);
    
    if (!personalInfoFields.clientName && !personalInfoFields.address) {
      return;
    }

    // Populate fullName from clientName (only if empty)
    const fullNameControl = this.form.get('personal.fullName');
    if (fullNameControl && !fullNameControl.value && personalInfoFields.clientName) {
      fullNameControl.setValue(personalInfoFields.clientName, { emitEvent: true });
    }

    // Populate companyName from clientName (only if empty)
    // Note: We use clientName for both, user can modify as needed
    const companyNameControl = this.form.get('personal.companyName');
    if (companyNameControl && !companyNameControl.value && personalInfoFields.clientName) {
      companyNameControl.setValue(personalInfoFields.clientName, { emitEvent: true });
    }

    // Populate address (only if empty)
    const addressControl = this.form.get('location.address');
    const currentAddressValue = addressControl?.value;
    const isEmpty = !currentAddressValue || currentAddressValue === '' || currentAddressValue === null;

    if (addressControl && personalInfoFields.address && isEmpty) {
      // Use patchValue to ensure the form group is updated correctly
      this.form.patchValue(
        { location: { address: personalInfoFields.address } },
        { emitEvent: true }
      );
      addressControl.markAsTouched();
    }

    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('aud-page');
    }

    const isBillAnalysis = this.router.url.includes('/analyse-facture');
    this.isBillAnalysisMode.set(isBillAnalysis);

    if (isBillAnalysis) {
      const stepParam = this.route.snapshot.queryParamMap.get('step');
      const stepNum = stepParam ? Number(stepParam) : NaN;
      if (Number.isFinite(stepNum) && stepNum >= 1 && stepNum <= this.lastFormStepNumber()) {
        this.currentStep.set(stepNum);
      }

      this.seoService.setSEO({
        title: 'Analyse facture | JOYA Energy',
        description:
          'Décryptez votre facture STEG et identifiez rapidement les opportunités d’économies sur votre consommation électrique.',
        url: 'https://joya-energy.com/analyse-facture',
        keywords:
          'analyse facture STEG, facture électricité Tunisie, décryptage facture, économies énergie',
      });
    } else {
      this.seoService.setSEO({
        title: 'Simulation & Production Photovoltaïque Entreprise | Joya Energy',
        description:
          'Calculez la production photovoltaïque et le potentiel solaire de votre entreprise. Obtenez une estimation de vos économies et de votre coût au kWh.',
        url: 'https://joya-energy.com/audit-solaire',
        keywords:
          'production photovoltaïque, potentiel solaire, coût kWh, simulation solaire entreprise, panneaux photovoltaïques Tunisie',
      });
    }

    const hasInvoiceControl = this.form.get('consumption.hasInvoice');

    if (isBillAnalysis) {
      this.billExtractionStore.clear();
      hasInvoiceControl?.setValue('yes', { emitEvent: false });
      this.hasInvoiceValue.set('yes');
    } else {
      if (hasInvoiceControl && !hasInvoiceControl.value) {
        hasInvoiceControl.setValue('yes', { emitEvent: false });
      }

      hasInvoiceControl?.valueChanges.subscribe((value: 'yes' | 'no' | null) => {
        this.hasInvoiceValue.set(value ?? 'yes');
        if (value === 'no') {
          this.billExtractionStore.clear();
        }
        this.cdr.markForCheck();
      });

      this.hasInvoiceValue.set(hasInvoiceControl?.value ?? 'yes');
    }

    // Auto-populate form fields from bill extraction store if available (only if hasInvoice is 'yes')
    if (hasInvoiceControl?.value === 'yes') {
      // Auto-populate consumption fields (step 1)
      this.autoPopulateFromBillExtraction();
      // Auto-populate personal info fields (step 3) - will populate when user reaches step 3
      // Also populate now if data is available
      this.autoPopulatePersonalInfoFromBillExtraction();
    }

    this.form.valueChanges.subscribe(() => {
      this.normalizeReferenceMonthControl();

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

    // Normalize any pre-filled / legacy month value on first paint
    this.normalizeReferenceMonthControl();

    // Subscribe to bill extraction store changes to auto-populate when bill is extracted
    // Only auto-populate if user has selected 'yes' for hasInvoice
    this.billExtractionStore.extractedData$.subscribe((extractedData) => {
      if (extractedData && hasInvoiceControl?.value === 'yes') {
        // Auto-populate consumption fields (step 1)
        this.autoPopulateFromBillExtraction();
        // Auto-populate personal info fields (step 3)
        this.autoPopulatePersonalInfoFromBillExtraction();
      }
    });

    // When user switches to MT, scroll to the newly revealed options
    this.form.get('consumption.tariffTension')?.valueChanges.subscribe((value: 'BT' | 'MT') => {
      if (value === 'MT') {
        // Wait for the view to render the mtOptionsContainer, then scroll
        setTimeout(() => this.scrollToMtOptions(), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    this.motion.scheduleRefresh();
  }

  private scrollToMtOptions(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.mtOptionsContainer?.nativeElement;
    if (!el) return;
    // scrollIntoView scrolls the actual scroll container (e.g. .form-content-scrollable), not the window
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  /**
   * Handle extraction from bill (currently disabled - service being reworked)
   */
  protected onExtractFromBill(): void {
    // Bill extraction service is being reworked
    // This method will be re-implemented when the new service is ready
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
    if (this.isBillAnalysisMode()) {
      this.prepareSkippedStepsDefaults();
    }

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

    const value = this.form.getRawValue() as {
      location?: { address?: string };
      consumption?: {
        measuredAmountTnd?: number;
        referenceMonth?: number | string;
        tariffTension?: string;
        operatingHoursCase?: string | null;
        tariffRegime?: string | null;
        billAttachment?: File | null;
        hasInvoice?: 'yes' | 'no' | null;
      };
      building?: { buildingType?: string; climateZone?: string };
      personal?: {
        fullName?: string;
        companyName?: string;
        email?: string;
        phoneNumber?: string;
      };
    };
    // Read Régime tarifaire (BT/MT) and MT options directly from controls so payload always matches UI selection
    const tariffTension = (
      this.form.get('consumption.tariffTension')?.value === 'MT' ? 'MT' : 'BT'
    ) as 'BT' | 'MT';
    const operatingHoursCase =
      tariffTension === 'MT'
        ? this.form.get('consumption.operatingHoursCase')?.value ?? null
        : null;
    const tariffRegime =
      tariffTension === 'MT' ? this.form.get('consumption.tariffRegime')?.value ?? null : null;

    const billFile = value.consumption?.billAttachment ?? null;
    if (billFile && value.consumption?.hasInvoice === 'yes') {
      this.submitFormWithBill(billFile);
      return;
    }

    this.createSimulationFromFormValues({
      tariffTension,
      operatingHoursCase,
      tariffRegime,
    });
  }

  /**
   * Extract bill via BillExtractionService when needed, then create simulation
   * through the standard JSON API (no /with-bill endpoint).
   */
  private submitFormWithBill(billFile: File): void {
    const existing = this.billExtractionStore.getExtractedData();
    if (existing && extractSolarAuditFields(existing)) {
      this.autoPopulateFromBillExtraction();
      this.autoPopulatePersonalInfoFromBillExtraction();
      this.createSimulationFromFormValues();
      return;
    }

    this.isSubmitting.set(true);
    const formData = new FormData();
    formData.append('billImage', billFile);

    this.billExtractionService
      .extractBillData(formData)
      .pipe(
        switchMap((response) => {
          if (!response.success || !response.data) {
            throw new Error('INVALID_EXTRACTION');
          }
          this.billExtractionStore.setExtractedData(response.data);
          this.autoPopulateFromBillExtraction();
          this.autoPopulatePersonalInfoFromBillExtraction();

          const fields = extractSolarAuditFields(response.data);
          if (!fields) {
            throw new Error('MISSING_FIELDS');
          }

          return this.auditService.createSimulation(this.buildCreateSimulationPayload());
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (result: IAuditSolaireSimulation) => this.handleSimulationSuccess(result, true),
        error: (error: { error?: { message?: string }; message?: string }) => {
          const message =
            error?.message === 'MISSING_FIELDS'
              ? "Impossible d’extraire le montant et le mois de référence de la facture."
              : error?.error?.message ||
                "Une erreur est survenue lors de l’extraction des données de la facture ou de la création de la simulation.";
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message,
          });
        },
      });
  }

  private createSimulationFromFormValues(overrides?: {
    tariffTension?: 'BT' | 'MT';
    operatingHoursCase?: string | null;
    tariffRegime?: string | null;
  }): void {
    this.isSubmitting.set(true);
    this.auditService
      .createSimulation(this.buildCreateSimulationPayload(overrides))
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (result: IAuditSolaireSimulation) => this.handleSimulationSuccess(result, false),
        error: (error: { error?: { message?: string } }) => {
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

  /** kWh printed on the bill, only when the user uploaded an invoice. */
  private readExtractedMonthlyKwh(): number | undefined {
    if (this.form.get('consumption.hasInvoice')?.value !== 'yes') {
      return undefined;
    }
    const fields = extractSolarAuditFields(this.billExtractionStore.getExtractedData());
    const monthlyKwh = fields?.measuredConsumptionKwh;
    if (monthlyKwh == null || monthlyKwh <= 0) {
      return undefined;
    }
    return monthlyKwh;
  }

  private buildCreateSimulationPayload(overrides?: {
    tariffTension?: 'BT' | 'MT';
    operatingHoursCase?: string | null;
    tariffRegime?: string | null;
  }): CreateSimulationPayload {
    const value = this.form.getRawValue() as {
      location?: { address?: string };
      consumption?: {
        measuredAmountTnd?: number;
        referenceMonth?: number | string;
      };
      building?: { buildingType?: string; climateZone?: string };
      personal?: {
        fullName?: string;
        companyName?: string;
        email?: string;
        phoneNumber?: string;
      };
    };

    const tariffTension =
      overrides?.tariffTension ??
      (this.form.get('consumption.tariffTension')?.value === 'MT' ? 'MT' : 'BT');
    const operatingHoursCase =
      overrides?.operatingHoursCase !== undefined
        ? overrides.operatingHoursCase
        : tariffTension === 'MT'
          ? this.form.get('consumption.operatingHoursCase')?.value ?? null
          : null;
    const tariffRegime =
      overrides?.tariffRegime !== undefined
        ? overrides.tariffRegime
        : tariffTension === 'MT'
          ? this.form.get('consumption.tariffRegime')?.value ?? null
          : null;

    const rawReferenceMonth = value.consumption?.referenceMonth;
    let referenceMonth = 1;
    if (typeof rawReferenceMonth === 'number') {
      referenceMonth = rawReferenceMonth || 1;
    } else if (typeof rawReferenceMonth === 'string') {
      const month = this.months.find((m) => m.label === rawReferenceMonth);
      referenceMonth = month ? month.value : 1;
    }

    const extractedKwh = this.readExtractedMonthlyKwh();

    return {
      address: value.location?.address ?? '',
      measuredAmountTnd: value.consumption?.measuredAmountTnd ?? 0,
      ...(extractedKwh != null ? { measuredConsumptionKwh: extractedKwh } : {}),
      referenceMonth,
      buildingType: value.building?.buildingType ?? '',
      climateZone: value.building?.climateZone ?? this.climateZones[0] ?? '',
      fullName: value.personal?.fullName ?? '',
      companyName: value.personal?.companyName ?? '',
      email: value.personal?.email ?? '',
      phoneNumber: value.personal?.phoneNumber ?? '',
      tariffTension,
      operatingHoursCase: (operatingHoursCase as CreateSimulationPayload['operatingHoursCase']) ?? undefined,
      tariffRegime: (tariffRegime as CreateSimulationPayload['tariffRegime']) ?? undefined,
    };
  }

  private handleSimulationSuccess(
    result: IAuditSolaireSimulation,
    fromBillExtraction: boolean
  ): void {
    this.simulationResult.set(result);
    const resultStep = this.steps().find((s) => s.isResult);
    if (resultStep) {
      this.currentStep.set(resultStep.number);
    }
    this.notificationStore.addNotification({
      type: 'success',
      title: 'Simulation terminée',
      message: fromBillExtraction
        ? 'Les données de votre facture ont été extraites et la simulation a été créée.'
        : 'Voici les résultats de votre audit solaire.',
    });
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
  }

  protected downloadPVReport(): void {
    const result = this.simulationResult();
    if (!result?.id) {
      this.notificationStore.addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Aucune simulation trouvée. Veuillez d’abord compléter l’audit solaire.",
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
    this.billFileSelected.set(false);
    this.billFile.set(null);
    this.billExtractionStore.clear();
    this.analyseFactureStore.clear();
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

  /** Formats decimal payback year (e.g. 3.9) as "X ans et Y mois" for the chart bubble. */
  protected formatPaybackYearsAndMonths(yearDecimal: number): string {
    const totalMonths = Math.round(yearDecimal * 12);
    if (totalMonths <= 0) return '0 mois';
    return this.formatPaybackPeriod(totalMonths);
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

  protected chartGuideStartY(hitY: number): number {
    const aboveHit = hitY - 56;
    return Math.max(36, Math.min(78, aboveHit));
  }

  protected chartTickY(tick: number): number {
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return 200;
    return 400 - ((tick - minValue) / range) * 400;
  }

  protected chartYearPercent(year: number): number {
    const years = this.getChartYears();
    if (years.length <= 1) return 0;
    const index = years.indexOf(year);
    if (index < 0) return 0;
    return (index / (years.length - 1)) * 100;
  }

  protected formatChartAxisValue(value: number): string {
    return Math.round(value).toLocaleString('fr-FR').replace(/\s/g, ' ');
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
    const simulation = this.simulationResult();
    const label = simulation ? this.formatPaybackPeriod(simulation.paybackMonths) : '';
    return label ? this.calculateBubbleWidth(label) : 100;
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
