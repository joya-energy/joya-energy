import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideSun,
  lucideZap,
  lucideCheck,
  lucideUtensilsCrossed,
  lucideBuilding2,
  lucideHammer,
  lucideHotel,
  lucideStethoscope,
  lucideFactory,
  lucideGraduationCap,
  lucideSparkles,
  lucideShirt,
  lucideDrumstick,
  lucideBox,
  lucideSnowflake,
  lucideCalendar,
  lucideInfo,
  lucideTrendingDown,
  lucideTrendingUp,
  lucideDollarSign,
  lucideClock,
  lucideBarChart3,
  lucideSettings,
  lucideBattery,
  lucideTarget,
  lucideLeaf,
  lucideLightbulb,
  lucideAlertTriangle,
  lucideCheckCircle,
  lucidePhone,
  lucideFileText,
  lucideCreditCard,
  lucideDownload,
  lucideLoader,
  lucideMapPin,
} from '@ng-icons/lucide';
import { IAuditSolaireSimulation } from '@shared/interfaces';
import { finalize } from 'rxjs/operators';
import { NotificationStore } from '../../core/notifications/notification.store';
import {
  AuditSolaireService,
  CreateSimulationPayload,
} from '../../core/services/audit-solaire.service';
import { AuditSolaireFormService } from './audit-solaire.form.service';
import { AuditSolaireFormStep, AuditSolaireFormGroup } from './audit-solaire.types';
import { BuildingTypes } from '@shared';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiImageComponent } from '../../shared/components/ui-image/ui-image.component';
import { FieldTooltipComponent } from '../../shared/components/field-tooltip/field-tooltip.component';
import {
  GoogleMapsInputComponent,
  AddressData,
} from '../../shared/components/google-maps-input/google-maps-input.component';
import { UploadCardComponent, UploadCardConfig } from '../../shared/components/upload-card';

interface BuildingTypeCard {
  id: BuildingTypes;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-audit-solaire',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    UiSelectComponent,
    UiImageComponent,
    FieldTooltipComponent,
    GoogleMapsInputComponent,
    UploadCardComponent,
  ],
  templateUrl: './audit-solaire.component.html',
  styleUrl: './audit-solaire.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideSun,
      lucideZap,
      lucideCheck,
      lucideUtensilsCrossed,
      lucideBuilding2,
      lucideHammer,
      lucideHotel,
      lucideStethoscope,
      lucideFactory,
      lucideGraduationCap,
      lucideSparkles,
      lucideShirt,
      lucideDrumstick,
      lucideBox,
      lucideSnowflake,
      lucideCalendar,
      lucideInfo,
      lucideTrendingDown,
      lucideTrendingUp,
      lucideDollarSign,
      lucideClock,
      lucideBarChart3,
      lucideSettings,
      lucideBattery,
      lucideTarget,
      lucideLeaf,
      lucideLightbulb,
      lucideAlertTriangle,
      lucideCheckCircle,
      lucidePhone,
      lucideFileText,
      lucideCreditCard,
      lucideDownload,
      lucideLoader,
      lucideMapPin,
    }),
  ],
})
export class AuditSolaireComponent {
  private notificationStore = inject(NotificationStore);
  private auditSolaireService = inject(AuditSolaireService);
  protected formService = inject(AuditSolaireFormService);

  protected auditForm: AuditSolaireFormGroup = this.formService.buildForm();
  protected step = signal(AuditSolaireFormStep.INVOICE);
  protected isSubmitting = signal(false);
  protected isGeneratingPDF = signal(false);
  protected simulationResult = signal<IAuditSolaireSimulation | null>(null);
  protected monthSelectControl = new FormControl<string>('');
  protected invoiceChoice = signal<'yes' | 'no' | null>(null);
  protected simulationLogs = signal<string[]>([]);
  protected currentSimulationStep = signal<string>('');
  /** Tooltip for "Gains nets cumulés vs CAPEX" chart: bubble position is relative to chart container so it stays inside */
  protected chartTooltip = signal<{
    year: number;
    gains: number;
    capex: number;
    x: number;
    y: number;
    curveScreenX: number;
    curveScreenY: number;
    bubbleScreenX: number;
    bubbleScreenY: number;
    bubbleLocalX: number;
    bubbleLocalY: number;
  } | null>(null);

  @ViewChild('lineChartSvg') private lineChartSvg?: ElementRef<SVGSVGElement>;
  @ViewChild('lineChartSvgContainer') private lineChartSvgContainer?: ElementRef<HTMLElement>;

  /** Tooltip for monthly bills chart: one bubble at a time (sans or avec) on bar hover */
  protected monthlyBillsTooltip = signal<{
    monthIndex: number;
    monthLabel: string;
    billWithoutPV: number;
    billWithPV: number;
    bar: 'sans' | 'avec';
  } | null>(null);

  protected readonly simulationSteps = [
    'Initialisation de la simulation',
    'Conversion du montant en consommation',
    'Résolution des coordonnées géographiques',
    'Récupération des données solaires PVGIS',
    'Extrapolation du profil de consommation',
    'Dimensionnement du système PV',
    'Analyse économique (25 ans)',
    'Sauvegarde de la simulation',
  ];

  private readonly monthMap: Record<string, number> = {
    Janvier: 1,
    Février: 2,
    Mars: 3,
    Avril: 4,
    Mai: 5,
    Juin: 6,
    Juillet: 7,
    Août: 8,
    Septembre: 9,
    Octobre: 10,
    Novembre: 11,
    Décembre: 12,
  };

  protected readonly AuditSolaireFormStep = AuditSolaireFormStep;

  constructor() {
    this.monthSelectControl.valueChanges.subscribe((monthLabel) => {
      if (monthLabel) {
        this.onMonthChange(monthLabel);
      }
    });
  }

  protected readonly locationFields = this.formService.locationFields;
  protected readonly consumptionFields = this.formService.consumptionFields;
  protected readonly buildingFields = this.formService.buildingFields;
  protected readonly climateZones = this.formService.climateZones;
  protected readonly months = this.formService.months;
  protected readonly monthLabels = this.months.map((m) => m.label);

  protected uploadCardConfig: UploadCardConfig = {
    title: "Téléchargez votre facture d'électricité",
    subtitle: 'ou cliquez pour sélectionner un fichier',
    acceptedTypes: 'image/*,application/pdf',
    maxSizeText: 'Formats: PDF, JPG, PNG (max 10MB)',
    extractButtonText: 'Continuer',
    manualEntryButtonText: 'Saisir manuellement',
    selectedFileText: 'Facture sélectionnée',
    changeFileText: 'Changer de fichier',
  };

  protected buildingTypeCards: BuildingTypeCard[] = [
    {
      id: BuildingTypes.CAFE_RESTAURANT,
      label: 'Café / Restaurant',
      icon: 'lucideUtensilsCrossed',
    },
    { id: BuildingTypes.OFFICE_ADMIN_BANK, label: 'Bureau / Banque', icon: 'lucideBuilding2' },
    { id: BuildingTypes.LIGHT_WORKSHOP, label: 'Atelier', icon: 'lucideHammer' },
    { id: BuildingTypes.HOTEL_GUESTHOUSE, label: 'Hôtel', icon: 'lucideHotel' },
    { id: BuildingTypes.CLINIC_MEDICAL, label: 'Clinique', icon: 'lucideStethoscope' },
    { id: BuildingTypes.HEAVY_FACTORY, label: 'Usine', icon: 'lucideFactory' },
    { id: BuildingTypes.SCHOOL_TRAINING, label: 'École', icon: 'lucideGraduationCap' },
    { id: BuildingTypes.BEAUTY_CENTER, label: 'Centre esthétique', icon: 'lucideSparkles' },
    { id: BuildingTypes.TEXTILE_PACKAGING, label: 'Ind. textile', icon: 'lucideShirt' },
    { id: BuildingTypes.FOOD_INDUSTRY, label: 'Ind. alimentaire', icon: 'lucideDrumstick' },
    { id: BuildingTypes.PLASTIC_INJECTION, label: 'Ind. plastique', icon: 'lucideBox' },
    { id: BuildingTypes.COLD_AGRO_INDUSTRY, label: 'Ind. froid', icon: 'lucideSnowflake' },
  ];

  protected heroStats = [
    { label: 'Retour sur investissement', value: '3-4 ans' },
    { label: 'Économies projetées', value: '+72% à 25 ans' },
    { label: 'Taux couverture solaire', value: '≈ 85%' },
  ];

  protected selectBuilding(buildingType: BuildingTypes): void {
    this.auditForm.controls.building.controls.buildingType.setValue(buildingType);
  }

  protected onAddressChange(addressData: AddressData | null): void {
    if (addressData) {
      this.auditForm.controls.location.controls.address.setValue(addressData.address);
    }
  }

  protected onMonthChange(monthLabel: string): void {
    const month = this.months.find((m) => m.label === monthLabel);
    if (month) {
      this.auditForm.controls.consumption.controls.referenceMonth.setValue(month.value);
    }
  }

  protected handleInvoiceChoice(choice: 'yes' | 'no'): void {
    this.invoiceChoice.set(choice);
    this.auditForm.controls.consumption.controls.hasInvoice.setValue(choice);
  }

  protected onBillSelected(file: File | null): void {
    if (file) {
      this.auditForm.controls.consumption.controls.billAttachment.setValue(file);
      this.notificationStore.addNotification({
        type: 'info',
        title: 'Facture sélectionnée',
        message: file.name,
      });
    } else {
      this.auditForm.controls.consumption.controls.billAttachment.setValue(null);
    }
  }

  protected onExtractFromBill(): void {
    this.nextStep();
  }

  protected onManualEntry(): void {
    this.auditForm.controls.consumption.controls.billAttachment.setValue(null);
    this.handleInvoiceChoice('no');
  }

  protected nextStep(): void {
    if (this.step() === AuditSolaireFormStep.INVOICE) {
      const hasInvoice = this.invoiceChoice();
      if (!hasInvoice) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Sélectionnez une option',
          message: "Veuillez indiquer si vous disposez d'une facture récente.",
        });
        return;
      }

      // If user selected "no", validate consumption fields
      if (hasInvoice === 'no') {
        const consumptionControls = this.auditForm.controls.consumption.controls;
        if (
          consumptionControls.measuredAmountTnd.invalid ||
          consumptionControls.referenceMonth.invalid
        ) {
          this.auditForm.controls.consumption.markAllAsTouched();
          this.notificationStore.addNotification({
            type: 'warning',
            title: 'Informations manquantes',
            message: 'Veuillez saisir votre montant mensuel et le mois de référence.',
          });
          return;
        }
      }

      // Always proceed to building step
      this.step.set(AuditSolaireFormStep.BUILDING);
      return;
    }

    if (this.step() === AuditSolaireFormStep.BUILDING && this.auditForm.controls.building.invalid) {
      this.auditForm.controls.building.markAllAsTouched();
      return;
    }

    if (this.step() === AuditSolaireFormStep.LOCATION) {
      // Validate all required fields before submission
      const locationValid = this.auditForm.controls.location.valid;
      const consumptionValid = this.auditForm.controls.consumption.valid;
      const buildingValid = this.auditForm.controls.building.valid;

      if (!locationValid) {
        this.auditForm.controls.location.markAllAsTouched();
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Adresse requise',
          message: "Veuillez saisir l'adresse complète du bâtiment.",
        });
        return;
      }

      if (!consumptionValid || !buildingValid) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Informations manquantes',
          message: 'Veuillez compléter toutes les informations requises.',
        });
        return;
      }

      this.submitSimulation();
      return;
    }

    const next = this.step() + 1;
    this.step.set(next);
  }

  protected prevStep(): void {
    if (this.step() > AuditSolaireFormStep.INVOICE) {
      this.step.set(this.step() - 1);
    }
  }

  protected isLocationStepValid(): boolean {
    // Check only the fields that are actually required for submission
    const location = this.auditForm.controls.location;
    const consumption = this.auditForm.controls.consumption;
    const building = this.auditForm.controls.building;

    // Address is required
    if (!location.controls.address.value || location.controls.address.invalid) {
      return false;
    }

    // Consumption fields are required
    if (
      consumption.controls.measuredAmountTnd.invalid ||
      consumption.controls.referenceMonth.invalid
    ) {
      return false;
    }

    // Building fields are required
    if (building.controls.buildingType.invalid || building.controls.climateZone.invalid) {
      return false;
    }

    return true;
  }

  protected submitSimulation(): void {
    if (this.isSubmitting()) {
      return;
    }

    const referenceMonthLabel = this.auditForm.controls.consumption.value.referenceMonth;
    const referenceMonth =
      typeof referenceMonthLabel === 'string'
        ? this.monthMap[referenceMonthLabel] ?? 1
        : referenceMonthLabel ?? 1;

    const payload: CreateSimulationPayload = {
      // Location
      address: this.auditForm.controls.location.value.address ?? '',
      fullName: this.auditForm.controls.location.value.fullName ?? '',
      companyName: this.auditForm.controls.location.value.companyName ?? '',
      email: this.auditForm.controls.location.value.email ?? '',
      phoneNumber: this.auditForm.controls.location.value.phoneNumber ?? '',
      measuredAmountTnd: this.auditForm.controls.consumption.value.measuredAmountTnd ?? 0,
      referenceMonth,

      // Building
      buildingType: this.auditForm.controls.building.value.buildingType ?? '',
      climateZone: this.auditForm.controls.building.value.climateZone ?? this.climateZones[0] ?? '',
    };

    this.isSubmitting.set(true);
    this.simulationLogs.set([]);
    this.currentSimulationStep.set('Initialisation de la simulation');

    // Simulate progress through steps
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < this.simulationSteps.length) {
        this.currentSimulationStep.set(this.simulationSteps[stepIndex]);
        this.simulationLogs.update((logs) => [...logs, this.simulationSteps[stepIndex]]);
      }
    }, 800); // Update every 800ms to simulate progress

    this.auditSolaireService
      .createSimulation(payload)
      .pipe(
        finalize(() => {
          clearInterval(progressInterval);
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (result: IAuditSolaireSimulation) => {
          this.simulationResult.set(result);
          this.step.set(AuditSolaireFormStep.REVIEW);
          this.simulationLogs.update((logs) => [...logs, 'Simulation terminée avec succès ✅']);
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation prête',
            message: 'Votre audit solaire a été généré avec succès.',
          });
        },
        error: (error: unknown) => {
          clearInterval(progressInterval);
          console.error(error);
          this.simulationLogs.update((logs) => [...logs, 'Erreur lors de la simulation ❌']);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de générer la simulation. Veuillez réessayer.',
          });
        },
      });
  }

  protected buildSummaryValue(label: string, value: string): { label: string; value: string } {
    return { label, value };
  }

  protected getPlaceholder(controlName: string): string {
    switch (controlName) {
      case 'measuredAmountTnd':
        return 'Ex: 2500';
      case 'referenceMonth':
        return 'Sélectionnez le mois';
      default:
        return '';
    }
  }

  protected formatPaybackPeriod(months: number | undefined): string {
    if (months === 0 || months === null || months === undefined) return 'Payback non atteint';
    if (!Number.isFinite(months) || months < 0) return '> 25 ans';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} mois`;
    } else if (remainingMonths === 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    } else {
      return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
    }
  }

  public trackByField(_: number, field: any): string {
    return field.control;
  }

  public trackByIndex(index: number): number {
    return index;
  }

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

  /**
   * Build "nice" Y-axis ticks for the monthly bills chart.
   * Returns ticks from top to bottom, without showing 0 (as requested).
   */
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
    // Calculate height as percentage of maxValue (topTick)
    // The bars are in chart-bars-pair which has height: 24rem (full height to match grid lines)
    // So we calculate percentage directly based on the full 24rem container
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
    return months[index] || '';
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

  protected getLineChartMaxValue(): number {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return 500000;
    }
    const maxGain = Math.max(...simulation.annualEconomics.map((e) => e.cumulativeNetGain || 0));
    const capex = simulation.installationCost || 0;
    const maxValue = Math.max(maxGain, capex);
    const minGain = Math.min(...simulation.annualEconomics.map((e) => e.cumulativeNetGain || 0));
    const minValue = Math.min(minGain, capex);
    // Use nice tick calculation for consistent Y-axis
    const { topTick } = this.calculateLineChartYAxisTicks(minValue, maxValue);
    return topTick;
  }

  protected getLineChartMinValue(): number {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return -50000;
    }
    const minGain = Math.min(...simulation.annualEconomics.map((e) => e.cumulativeNetGain || 0));
    const capex = simulation.installationCost || 0;
    const minValue = Math.min(minGain, capex);
    const maxGain = Math.max(...simulation.annualEconomics.map((e) => e.cumulativeNetGain || 0));
    const maxValue = Math.max(maxGain, capex);
    // Use nice tick calculation for consistent Y-axis
    const { bottomTick } = this.calculateLineChartYAxisTicks(minValue, maxValue);
    return bottomTick;
  }

  protected getLineChartYAxisTicks(): number[] {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return [500000, 400000, 300000, 200000, 100000, 0];
    }
    const maxGain = Math.max(...simulation.annualEconomics.map((e) => e.cumulativeNetGain || 0));
    const capex = simulation.installationCost || 0;
    const maxValue = Math.max(maxGain, capex);
    const minGain = Math.min(...simulation.annualEconomics.map((e) => e.cumulativeNetGain || 0));
    const minValue = Math.min(minGain, capex);

    const { ticks } = this.calculateLineChartYAxisTicks(minValue, maxValue);
    return ticks;
  }

  private calculateLineChartYAxisTicks(
    minValue: number,
    maxValue: number
  ): { topTick: number; bottomTick: number; ticks: number[] } {
    const tickCount = 5; // 0%, 20%, 40%, 60%, 80%, 100% (6 positions = 5 intervals)
    const range = maxValue - minValue;
    const safeRange = Number.isFinite(range) && range > 0 ? range : 1;

    // Calculate a "nice" step size
    const rawStep = safeRange / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    let stepBase;
    if (normalized <= 1) stepBase = 1;
    else if (normalized <= 2) stepBase = 2;
    else if (normalized <= 5) stepBase = 5;
    else stepBase = 10;
    const step = stepBase * magnitude;

    // Round min and max to nice values
    const bottomTick = Math.floor(minValue / step) * step;
    const topTick = Math.ceil(maxValue / step) * step;
    const actualRange = topTick - bottomTick;
    const actualStep = actualRange / tickCount;

    // Generate ticks from bottom to top (ascending: min to max)
    const ticksAscending = Array.from(
      { length: tickCount + 1 },
      (_, i) => bottomTick + i * actualStep
    );

    // Reverse to get descending order (max to min) for display (top to bottom in chart)
    const ticks = ticksAscending.reverse();

    return { topTick, bottomTick, ticks };
  }

  protected getChartYears(): number[] {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics) {
      return [];
    }
    return simulation.annualEconomics.map((e) => e.year).slice(0, 25); // All 25 years
  }

  // Get sparse X-axis labels (only years 1, 5, 10, 15, 20, 25) like in PDF
  protected getSparseChartYears(): number[] {
    return [1, 5, 10, 15, 20, 25];
  }

  protected getGainsLinePoints(): string {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return '';
    }
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return '';
    const years = this.getChartYears();
    if (years.length === 0) return '';
    const points = years
      .map((year, index) => {
        const data = simulation.annualEconomics[index];
        if (!data) return '';
        const value = data.cumulativeNetGain || 0;
        const x = years.length > 1 ? ((index / (years.length - 1)) * 1000).toFixed(2) : '500';
        const y = (400 - ((value - minValue) / range) * 400).toFixed(2);
        return `${x},${y}`;
      })
      .filter((p) => p !== '')
      .join(' ');
    return points;
  }

  protected getGainsLinePointsArray(): Array<{ x: number; y: number }> {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return [];
    }
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return [];
    const years = this.getChartYears();
    if (years.length === 0) return [];
    return years.map((year, index) => {
      const data = simulation.annualEconomics[index];
      if (!data) return { x: 0, y: 200 };
      const value = data.cumulativeNetGain || 0;
      const x = years.length > 1 ? (index / (years.length - 1)) * 1000 : 500;
      const y = 400 - ((value - minValue) / range) * 400;
      return { x, y };
    });
  }

  protected getCapexLinePoints(): string {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return '';
    }
    const capex = simulation.installationCost || 0;
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return '';
    const years = this.getChartYears();
    if (years.length === 0) return '';
    const points = years
      .map((year, index) => {
        const x = years.length > 1 ? ((index / (years.length - 1)) * 1000).toFixed(2) : '500';
        const y = (400 - ((capex - minValue) / range) * 400).toFixed(2);
        return `${x},${y}`;
      })
      .join(' ');
    return points;
  }

  protected getCapexLinePointsArray(): Array<{ x: number; y: number }> {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return [];
    }
    const capex = simulation.installationCost || 0;
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return [];
    const years = this.getChartYears();
    if (years.length === 0) return [];
    return years.map((year, index) => {
      const x = years.length > 1 ? (index / (years.length - 1)) * 1000 : 500;
      const y = 400 - ((capex - minValue) / range) * 400;
      return { x, y };
    });
  }

  /** SVG path "d" for area under the gains curve (viewBox 0 0 1000 400, bottom at y=400) */
  protected getGainsAreaPath(): string {
    const points = this.getGainsLinePointsArray();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map((p) => `${p.x},${p.y}`).join(' L ');
    return `M ${first.x},400 L ${line} L ${last.x},400 Z`;
  }

  /** SVG path "d" for area under the CAPEX line */
  protected getCapexAreaPath(): string {
    const points = this.getCapexLinePointsArray();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map((p) => `${p.x},${p.y}`).join(' L ');
    return `M ${first.x},400 L ${line} L ${last.x},400 Z`;
  }

  // Calculate intersection point (where cumulative gains = CAPEX)
  protected getIntersectionPoint(): { x: number; y: number; year: number; capex: number } | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return null;
    }
    const capex = simulation.installationCost || 0;
    const years = this.getChartYears();
    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return null;

    // Find the year where cumulative gains crosses CAPEX
    for (let i = 0; i < simulation.annualEconomics.length && i < years.length; i++) {
      const currentGain = simulation.annualEconomics[i].cumulativeNetGain || 0;
      const nextGain =
        i + 1 < simulation.annualEconomics.length
          ? simulation.annualEconomics[i + 1].cumulativeNetGain || 0
          : currentGain;

      // Check if CAPEX is between current and next year
      if (currentGain <= capex && nextGain >= capex) {
        // Linear interpolation to find exact intersection
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

  // Get final cumulative gains value (at year 25)
  protected getFinalGainsValue(): number | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return null;
    }
    // Get the 25th year (index 24) or the last available year
    const year25Index = Math.min(24, simulation.annualEconomics.length - 1);
    return simulation.annualEconomics[year25Index]?.cumulativeNetGain || null;
  }

  // Get final point position for annotation
  protected getFinalGainsPoint(): { x: number; y: number } | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return null;
    }
    const years = this.getChartYears();
    if (years.length === 0) return null;

    const maxValue = this.getLineChartMaxValue();
    const minValue = this.getLineChartMinValue();
    const range = maxValue - minValue;
    if (range === 0) return null;

    const year25Index = Math.min(24, years.length - 1);
    const finalGain = this.getFinalGainsValue();
    if (finalGain === null) return null;

    const x = years.length > 1 ? (year25Index / (years.length - 1)) * 1000 : 500;
    const y = 400 - ((finalGain - minValue) / range) * 400;

    return { x, y };
  }

  // Get final CAPEX value (constant, same as initial)
  protected getFinalCapexValue(): number | null {
    const simulation = this.simulationResult();
    if (!simulation) return null;
    return simulation.installationCost || null;
  }

  // Get final CAPEX point position for annotation (at year 25)
  protected getFinalCapexPoint(): { x: number; y: number } | null {
    const simulation = this.simulationResult();
    if (!simulation?.annualEconomics || simulation.annualEconomics.length === 0) {
      return null;
    }
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

  // Calculate bubble width based on text length
  private calculateBubbleWidth(text: string): number {
    const charWidth = 7; // Approximate width per character for 14px bold font
    const padding = 30; // 15px padding on each side
    return Math.max(80, text.length * charWidth + padding);
  }

  // Get intersection bubble dimensions
  protected getIntersectionBubbleWidth(): number {
    const point = this.getIntersectionPoint();
    if (!point) return 100;
    const text = point.year.toFixed(1) + ' ans';
    return this.calculateBubbleWidth(text);
  }

  protected getIntersectionBubbleX(): number {
    const point = this.getIntersectionPoint();
    if (!point) return 0;
    return point.x - this.getIntersectionBubbleWidth() / 2;
  }

  // Get final gains bubble dimensions
  protected getFinalGainsBubbleWidth(): number {
    const value = this.getFinalGainsValue();
    if (value === null) return 180;
    const text = Math.round(value).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' DT';
    return this.calculateBubbleWidth(text);
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

  // Get final CAPEX bubble dimensions
  protected getFinalCapexBubbleWidth(): number {
    const value = this.getFinalCapexValue();
    if (value === null || value === 0) return 180;
    const text = Math.round(value).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' DT';
    return this.calculateBubbleWidth(text);
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

  /** Convert mouse position to SVG viewBox coordinates and show tooltip for that year */
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
    // viewBox is 0 0 1000 400; x maps index 0..n-1 to 0..1000
    const rawIndex = (svgP.x / 1000) * (n - 1);
    const index = Math.max(0, Math.min(n - 1, Math.round(rawIndex)));
    const data = simulation.annualEconomics[index];
    const capex = simulation.installationCost ?? 0;
    if (!data) {
      this.chartTooltip.set(null);
      return;
    }
    // Only show tooltip when cursor is near one of the curves (in viewBox units)
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
    const curveHitRadius = 28; // viewBox units – cursor must be this close to a curve
    if (distGains > curveHitRadius && distCapex > curveHitRadius) {
      this.chartTooltip.set(null);
      return;
    }
    // Position bubble between the two curves (midpoint vertically at this year)
    const midY = (gainsY + capexY) / 2;
    const bubblePt = svg.createSVGPoint();
    bubblePt.x = svgP.x;
    bubblePt.y = midY;
    const bubbleScreen = bubblePt.matrixTransform(ctm);
    // Keep curve point for optional line; bubble sits between curves
    const gainsPoints = this.getGainsLinePointsArray();
    const capexPoints = this.getCapexLinePointsArray();
    const curvePoint = distGains <= distCapex ? gainsPoints[index] : capexPoints[index];
    if (!curvePoint) {
      this.chartTooltip.set(null);
      return;
    }
    const curvePt = svg.createSVGPoint();
    curvePt.x = curvePoint.x;
    curvePt.y = curvePoint.y;
    const curveScreen = curvePt.matrixTransform(ctm);
    // Position bubble relative to chart container so it stays inside the chart (avoids fixed + transform issues)
    const container = this.lineChartSvgContainer?.nativeElement;
    const containerRect = container?.getBoundingClientRect();
    const bubbleLocalX = containerRect ? bubbleScreen.x - containerRect.left : bubbleScreen.x;
    const bubbleLocalY = containerRect ? bubbleScreen.y - containerRect.top : bubbleScreen.y;
    this.chartTooltip.set({
      year: data.year,
      gains: data.cumulativeNetGain ?? 0,
      capex,
      x: event.clientX,
      y: event.clientY,
      curveScreenX: curveScreen.x,
      curveScreenY: curveScreen.y,
      bubbleScreenX: bubbleScreen.x,
      bubbleScreenY: bubbleScreen.y,
      bubbleLocalX,
      bubbleLocalY,
    });
  }

  protected onChartMouseLeave(): void {
    this.chartTooltip.set(null);
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
    this.auditSolaireService
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
            message:
              "Le rapport PV a été téléchargé sur votre PC. L'envoi par email est en cours en arrière-plan.",
          });

          // Send by email in background (for testing / production)
          this.auditSolaireService.sendPVReportByEmail(result.id).subscribe({
            next: (response) => {
              this.notificationStore.addNotification({
                type: 'success',
                title: 'Rapport envoyé par email',
                message: `Le rapport PV a également été envoyé à ${response.email}.`,
              });
            },
            error: (err) => {
              console.warn('PV report email send failed:', err);
              this.notificationStore.addNotification({
                type: 'info',
                title: 'Téléchargement réussi',
                message:
                  "Le PDF a été téléchargé. L'envoi par email n'a pas abouti (vérifiez la config Postmark).",
              });
            },
          });
        },
        error: (error) => {
          console.error('Error downloading PV PDF:', error);
          const errorMessage =
            error?.error?.error ||
            error?.error?.message ||
            'Impossible de télécharger le rapport PV. Veuillez réessayer.';
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: errorMessage,
          });
        },
      });
  }
}
