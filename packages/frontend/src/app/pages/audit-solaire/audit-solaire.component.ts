import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
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
  lucideMapPin
} from '@ng-icons/lucide';
import { IAuditSolaireSimulation } from '@shared/interfaces';
import { finalize } from 'rxjs/operators';
import { NotificationStore } from '../../core/notifications/notification.store';
import { AuditSolaireService, CreateSimulationPayload } from '../../core/services/audit-solaire.service';
import { AuditSolaireFormService } from './audit-solaire.form.service';
import { AuditSolaireFormStep, AuditSolaireFormGroup } from './audit-solaire.types';
import { BuildingTypes } from '@shared';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiImageComponent } from '../../shared/components/ui-image/ui-image.component';
import { FieldTooltipComponent } from '../../shared/components/field-tooltip/field-tooltip.component';
import { GoogleMapsInputComponent, AddressData } from '../../shared/components/google-maps-input/google-maps-input.component';
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
    UploadCardComponent
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
      lucideMapPin
    })
  ]
})
export class AuditSolaireComponent {
  private notificationStore = inject(NotificationStore);
  private auditSolaireService = inject(AuditSolaireService);
  protected formService = inject(AuditSolaireFormService);

  protected auditForm: AuditSolaireFormGroup = this.formService.buildForm();
  protected step = signal(AuditSolaireFormStep.INVOICE);
  protected isSubmitting = signal(false);
  protected simulationResult = signal<IAuditSolaireSimulation | null>(null);
  protected monthSelectControl = new FormControl<string>('');
  protected invoiceChoice = signal<'yes' | 'no' | null>(null);
  protected simulationLogs = signal<string[]>([]);
  protected currentSimulationStep = signal<string>('');

  protected readonly simulationSteps = [
    'Initialisation de la simulation',
    'Conversion du montant en consommation',
    'Résolution des coordonnées géographiques',
    'Récupération des données solaires PVGIS',
    'Extrapolation du profil de consommation',
    'Dimensionnement du système PV',
    'Analyse économique (25 ans)',
    'Sauvegarde de la simulation'
  ];

  private readonly monthMap: Record<string, number> = {
    'Janvier': 1,
    'Février': 2,
    'Mars': 3,
    'Avril': 4,
    'Mai': 5,
    'Juin': 6,
    'Juillet': 7,
    'Août': 8,
    'Septembre': 9,
    'Octobre': 10,
    'Novembre': 11,
    'Décembre': 12
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
  protected readonly monthLabels = this.months.map(m => m.label);

  protected uploadCardConfig: UploadCardConfig = {
    title: 'Téléchargez votre facture d\'électricité',
    subtitle: 'ou cliquez pour sélectionner un fichier',
    acceptedTypes: 'image/*,application/pdf',
    maxSizeText: 'Formats: PDF, JPG, PNG (max 10MB)',
    extractButtonText: 'Continuer',
    manualEntryButtonText: 'Saisir manuellement',
    selectedFileText: 'Facture sélectionnée',
    changeFileText: 'Changer de fichier'
  };

  protected buildingTypeCards: BuildingTypeCard[] = [
    { id: BuildingTypes.CAFE_RESTAURANT, label: 'Café / Restaurant', icon: 'lucideUtensilsCrossed' },
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
    { id: BuildingTypes.COLD_AGRO_INDUSTRY, label: 'Ind. froid', icon: 'lucideSnowflake' }
  ];

  protected heroStats = [
    { label: 'Retour sur investissement', value: '3-4 ans' },
    { label: 'Économies projetées', value: '+72% à 25 ans' },
    { label: 'Taux couverture solaire', value: '≈ 85%' }
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
    const month = this.months.find(m => m.label === monthLabel);
    if (month) {
      this.auditForm.controls.consumption.controls.referenceMonth.setValue(month.value);
    }
  }

  protected handleInvoiceChoice(choice: 'yes' | 'no'): void {
    console.log('🔵 [AuditSolaire] handleInvoiceChoice called with:', choice);
    console.log('🔵 [AuditSolaire] Before - invoiceChoice signal:', this.invoiceChoice());
    console.log('🔵 [AuditSolaire] Before - form value:', this.auditForm.controls.consumption.controls.hasInvoice.value);
    
    this.invoiceChoice.set(choice);
    this.auditForm.controls.consumption.controls.hasInvoice.setValue(choice);
    
    console.log('🔵 [AuditSolaire] After - invoiceChoice signal:', this.invoiceChoice());
    console.log('🔵 [AuditSolaire] After - form value:', this.auditForm.controls.consumption.controls.hasInvoice.value);
  }

  protected onBillSelected(file: File | null): void {
    console.log('🔵 [AuditSolaire] onBillSelected called with file:', file);
    if (file) {
      this.auditForm.controls.consumption.controls.billAttachment.setValue(file);
      this.notificationStore.addNotification({
        type: 'info',
        title: 'Facture sélectionnée',
        message: file.name
      });
      console.log('🔵 [AuditSolaire] File set in form:', this.auditForm.controls.consumption.controls.billAttachment.value);
    } else {
      this.auditForm.controls.consumption.controls.billAttachment.setValue(null);
      console.log('🔵 [AuditSolaire] File cleared from form');
    }
  }

  protected onExtractFromBill(): void {
    console.log('🔵 [AuditSolaire] onExtractFromBill called');
    // For now, just proceed to the next step
    // Later this could extract data from the bill
    this.nextStep();
  }

  protected onManualEntry(): void {
    console.log('🔵 [AuditSolaire] onManualEntry called');
    this.auditForm.controls.consumption.controls.billAttachment.setValue(null);
    this.handleInvoiceChoice('no');
  }

  protected nextStep(): void {
    console.log('🔵 [AuditSolaire] nextStep called - current step:', this.step());
    console.log('🔵 [AuditSolaire] invoiceChoice:', this.invoiceChoice());
    
    if (this.step() === AuditSolaireFormStep.INVOICE) {
      const hasInvoice = this.invoiceChoice();
      console.log('🔵 [AuditSolaire] hasInvoice value:', hasInvoice);
      
      if (!hasInvoice) {
        console.log('⚠️ [AuditSolaire] No invoice choice selected');
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Sélectionnez une option',
          message: "Veuillez indiquer si vous disposez d'une facture récente."
        });
        return;
      }

      // If user selected "no", validate consumption fields
      if (hasInvoice === 'no') {
        const consumptionControls = this.auditForm.controls.consumption.controls;
        if (consumptionControls.measuredAmountTnd.invalid || consumptionControls.referenceMonth.invalid) {
          this.auditForm.controls.consumption.markAllAsTouched();
          this.notificationStore.addNotification({
            type: 'warning',
            title: 'Informations manquantes',
            message: 'Veuillez saisir votre montant mensuel et le mois de référence.'
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
          message: 'Veuillez saisir l\'adresse complète du bâtiment.'
        });
        return;
      }

      if (!consumptionValid || !buildingValid) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Informations manquantes',
          message: 'Veuillez compléter toutes les informations requises.'
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

  private submitSimulation(): void {
    if (this.auditForm.invalid) {
      this.auditForm.markAllAsTouched();
      return;
    }
    const referenceMonthLabel = this.auditForm.controls.consumption.value.referenceMonth;
    const referenceMonth = typeof referenceMonthLabel === 'string'
      ? this.monthMap[referenceMonthLabel] ?? 1
      : referenceMonthLabel ?? 1;

    const payload: CreateSimulationPayload = {
      address: this.auditForm.controls.location.value.address ?? '',
      measuredAmountTnd: this.auditForm.controls.consumption.value.measuredAmountTnd ?? 0,
      referenceMonth,
      buildingType: this.auditForm.controls.building.value.buildingType ?? '',
      climateZone: this.auditForm.controls.building.value.climateZone ?? this.climateZones[0] ?? ''
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
        this.simulationLogs.update(logs => [...logs, this.simulationSteps[stepIndex]]);
      }
    }, 800); // Update every 800ms to simulate progress

    this.auditSolaireService
      .createSimulation(payload)
      .pipe(finalize(() => {
        clearInterval(progressInterval);
        this.isSubmitting.set(false);
      }))
      .subscribe({
        next: (result: IAuditSolaireSimulation) => {
          console.log('✅ Simulation completed with economic metrics:', {
            simplePaybackYears: result.simplePaybackYears,
            discountedPaybackYears: result.discountedPaybackYears,
            roi25Years: result.roi25Years,
            npv: result.npv
          });

          this.simulationResult.set(result);
          this.step.set(AuditSolaireFormStep.REVIEW);
          this.simulationLogs.update(logs => [...logs, 'Simulation terminée avec succès ✅']);
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation prête',
            message: 'Votre audit solaire a été généré avec succès.'
          });
        },
        error: (error: unknown) => {
          clearInterval(progressInterval);
          console.error(error);
          this.simulationLogs.update(logs => [...logs, 'Erreur lors de la simulation ❌']);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de générer la simulation. Veuillez réessayer.'
          });
        }
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
}

