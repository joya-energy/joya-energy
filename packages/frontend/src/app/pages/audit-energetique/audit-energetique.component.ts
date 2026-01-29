import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight } from '@ng-icons/lucide';
import { BuildingTypes, Governorates } from '@shared';
import { finalize } from 'rxjs/operators';
import {
  BUILDING_CARD_CONFIG,
  BUILDING_ICON_REGISTRY,
  BuildingCardConfig
} from '../../shared/icons/audit-building-icons';
import { FieldTooltipComponent } from '../../shared/components/field-tooltip/field-tooltip.component';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UploadCardComponent, UploadCardConfig } from '../../shared/components/upload-card';
import { NotificationStore } from '../../core/notifications/notification.store';
import { AuditEnergetiqueRequest,
  AuditEnergetiqueResponse,
  AuditEnergetiqueService,
  ExtractBillResponse,
  ExtractedBillData
} from '../../core/services/audit-energetique.service';
import { AuditFormService } from './audit-energetique.form.service';
import {
  AuditFormValue,
  BuildingFieldName,
  BuildingForm,
  ConsumptionFieldName,
  FieldConfig,
  FormStep,
  PersonalFieldName,
  TechnicalFieldName
} from './audit-energetique.types';


export enum AuditFormStep {
  IMPORT = 1,
  BUILDING = 2,
  TECHNICAL = 3,
  RESULTS = 4
}

@Component({
  selector: 'app-audit-energetique',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    UiSelectComponent,
    FieldTooltipComponent,
    UploadCardComponent
  ],
  templateUrl: './audit-energetique.component.html',
  styleUrl: './audit-energetique.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      ...BUILDING_ICON_REGISTRY,
      lucideArrowLeft,
      lucideArrowRight
    })
  ]
})
export class AuditEnergetiqueComponent {
  private auditService = inject(AuditEnergetiqueService);
  private notificationStore = inject(NotificationStore);
  protected formService = inject(AuditFormService);

  protected auditForm = this.formService.buildForm();

  protected isExtracting = signal(false);
  protected isSubmitting = signal(false);
  protected isGeneratingPDF = signal(false);
  protected extraction = signal<ExtractedBillData | null>(null);
  protected billFile = signal<File | null>(null);
  protected simulationResult = signal<AuditEnergetiqueResponse['data'] | null>(null);
  protected step = signal<AuditFormStep>(AuditFormStep.IMPORT);
  protected formStepTitle = computed(() => {
    if (this.step() === AuditFormStep.BUILDING) {
      return 'Profil bâtiment et usages';
    }
    if (this.step() === AuditFormStep.TECHNICAL) {
      return 'Informations générales';
    }
    if (this.step() === AuditFormStep.RESULTS) {
      return 'Résultats de l\'audit';
    }
    return 'Complétez votre audit';
  });

  protected governorates = this.formService.governorates;

  private static readonly FEATURED_BUILDING_TYPES: BuildingTypes[] = [
    BuildingTypes.CAFE_RESTAURANT,
    BuildingTypes.LIGHT_WORKSHOP,
    BuildingTypes.HOTEL_GUESTHOUSE,
    BuildingTypes.CLINIC_MEDICAL,
    BuildingTypes.HEAVY_FACTORY,
    BuildingTypes.SCHOOL_TRAINING,
    BuildingTypes.BEAUTY_CENTER,
  ];

  // Visual Building Types Configuration
  protected buildingCategories = BUILDING_CARD_CONFIG.filter((config) =>
    AuditEnergetiqueComponent.FEATURED_BUILDING_TYPES.includes(config.id)
  );

  protected otherBuildingTypes = BUILDING_CARD_CONFIG
    .filter((config) => !AuditEnergetiqueComponent.FEATURED_BUILDING_TYPES.includes(config.id))
    .map((config) => config.label);

  protected buildingTypes = BUILDING_CARD_CONFIG.map((config) => config.id);

  protected personalFields: FieldConfig<PersonalFieldName>[] = this.formService.personalFields;
  protected consumptionFields: FieldConfig<ConsumptionFieldName>[] = this.formService.consumptionFields;
  protected buildingFields: FieldConfig<BuildingFieldName>[] = this.formService.buildingFields;
  protected technicalFields: FieldConfig<TechnicalFieldName>[] = this.formService.technicalFields;
  protected get buildingControls(): BuildingForm {
    return this.auditForm.controls.building.controls;
  }

  protected uploadCardConfig: UploadCardConfig = {
    title: 'Glissez-déposez votre facture STEG',
    subtitle: 'ou cliquez pour sélectionner un fichier',
    acceptedTypes: 'image/*,application/pdf',
    maxSizeText: 'Formats: PDF, JPG, PNG (max 10MB)',
    extractButtonText: 'Extraire les données',
    manualEntryButtonText: 'Je n\'ai pas de facture, remplir manuellement',
    selectedFileText: 'Fichier sélectionné',
    changeFileText: 'Changer de fichier'
  };

  protected startManualEntry(): void {
    this.step.set(AuditFormStep.BUILDING);
  }

  protected returnToImport(): void {
    this.step.set(AuditFormStep.BUILDING);
  }

  protected continueToGeneralStep(): void {
    const canProceed = this.validateFormSections(['building', 'technical']);

    if (!canProceed) {
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Formulaire incomplet',
        message: 'Complétez les informations du bâtiment avant de continuer.'
      });
      return;
    }

    this.step.set(AuditFormStep.TECHNICAL);
  }

  protected backToBuildingStep(): void {
    this.step.set(AuditFormStep.BUILDING);
  }

  private validateFormSections(sections: Array<keyof AuditFormValue>): boolean {
    let isValid = true;

    sections.forEach((section) => {
      const group = this.auditForm.controls[section];
      if (!group) {
        return;
      }

      group.markAllAsTouched();
      group.updateValueAndValidity();

      if (group.invalid) {
        isValid = false;
      }
    });

    return isValid;
  }

  protected isFeaturedBuilding(type: string | null): boolean {
    if (!type) return true; // Show cards by default if nothing selected
    return AuditEnergetiqueComponent.FEATURED_BUILDING_TYPES.includes(type as BuildingTypes);
  }

  protected trackByField(_: number, field: FieldConfig<string>): string {
    return field.control;
  }

  protected trackByString(_: number, option: string): string {
    return option;
  }

  protected trackByCategory(_: number, category: BuildingCardConfig): string {
    return category.id;
  }

  protected onBillSelected(file: File | null): void {
    if (file) {
      this.billFile.set(file);
      this.notificationStore.addNotification({
        type: 'info',
        title: 'Facture sélectionnée',
        message: file.name
      });
    } else {
      this.billFile.set(null);
    }
  }

  protected onExtractFromBill(): void {
    this.extractFromBill();
  }

  protected onManualEntry(): void {
    this.startManualEntry();
  }

  protected toggleSelection(controlName: 'equipmentCategories' | 'existingMeasures', value: string): void {
    const control = this.auditForm.controls.technical.controls[controlName];
    const current = control.value ?? [];
    if (current.includes(value)) {
      control.setValue(current.filter((item) => item !== value));
    } else {
      control.setValue([...current, value]);
    }
  }

  protected selectBuildingType(type: string): void {
    this.auditForm.controls.building.controls.buildingType.setValue(type);
  }

  protected extractFromBill(): void {
    const file = this.billFile();
    if (!file) {
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Aucune facture',
        message: 'Veuillez sélectionner une facture STEG avant d’extraire les données.'
      });
      return;
    }

    const formData = new FormData();
    formData.append('billImage', file);

    this.isExtracting.set(true);
    
    // Immediately advance to step 2 (Building Profile) to mask latency
    this.step.set(AuditFormStep.BUILDING);
    
    this.auditService
      .extractBillData(formData)
      .pipe(finalize(() => this.isExtracting.set(false)))
      .subscribe({
        next: (response: ExtractBillResponse) => {
          this.extraction.set(response.data);
          this.patchFormWithExtraction(response.data);

        },
        error: (error) => {
          console.error(error);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Extraction impossible',
            message: 'Impossible de lire la facture. Vous pourrez saisir les données manuellement.'
          });
        }
      });
  }

  private patchFormWithExtraction(data: ExtractedBillData): void {
    const personal = this.auditForm.controls.personal;
    const consumption = this.auditForm.controls.consumption;

    this.patchIfEmpty(
      consumption.controls.monthlyBillAmount,
      this.toNumber(data.monthlyBillAmount.value)
    );
    this.patchIfEmpty(
      consumption.controls.recentBillConsumption,
      this.toNumber(data.recentBillConsumption.value)
    );
    this.patchIfEmpty(consumption.controls.tariffType, (data.tariffType.value as string) ?? '');
    this.patchIfEmpty(
      consumption.controls.contractedPower,
      this.toNumber(data.contractedPower.value)
    );
    this.patchIfEmpty(personal.controls.address, (data.address.value as string) ?? '');
    this.patchIfEmpty(personal.controls.companyName, (data.clientName.value as string) ?? '');

    const governorate = data.governorate.value as Governorates | null;
    if (governorate && this.governorates.includes(governorate)) {
      this.patchIfEmpty(personal.controls.governorate, governorate);
    }
  }

  private patchIfEmpty(control: AbstractControl<any, any>, value: unknown): void {
    if (!control) return;
    const currentValue = control.value;
    if (currentValue === null || currentValue === '' || currentValue === undefined) {
      control.setValue((value ?? null) as never);
    }
  }

  private resetFormState(): void {
    this.auditForm.reset(this.formService.getDefaultFormValue());
  }

  private toNumber(value: number | string | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  protected downloadPDF(): void {
    const result = this.simulationResult();
    if (!result?.simulationId) {
      this.notificationStore.addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Aucune simulation trouvée. Veuillez d\'abord compléter l\'audit.'
      });
      return;
    }

    this.isGeneratingPDF.set(true);
    this.auditService
      .generateAndSendPDF(result.simulationId)
      .pipe(finalize(() => this.isGeneratingPDF.set(false)))
      .subscribe({
        next: (response) => {
          this.notificationStore.addNotification({
            type: 'success',
            title: 'PDF généré',
            message: `Le rapport PDF a été généré et envoyé à ${response.email}. Il a également été sauvegardé dans le cloud.`
          });
        },
        error: (error) => {
          console.error('Error generating PDF:', error);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de générer le PDF. Veuillez réessayer.'
          });
        }
      });
  }

  protected submitSimulation(): void {
    if (this.auditForm.invalid) {
      this.auditForm.markAllAsTouched();
      this.notificationStore.addNotification({
        type: 'warning',
        title: 'Formulaire incomplet',
        message: 'Veuillez remplir tous les champs obligatoires.'
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
          this.step.set (AuditFormStep.RESULTS);
          this.notificationStore.addNotification({
            type: 'success',
            title: 'Simulation terminée',
            message: 'Voici les résultats de votre audit.'
          });
        },
        error: (error) => {
          console.error(error);
          this.notificationStore.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de créer la simulation. Vérifiez les informations saisies.'
          });
        }
      });
  }

  private buildPayload(): AuditEnergetiqueRequest {
    const { personal, consumption, building, technical } = this.auditForm.getRawValue();
    return {
      fullName: personal.fullName,
      companyName: personal.companyName,
      email: personal.email,
      phoneNumber: personal.phoneNumber,
      address: personal.address,
      governorate: personal.governorate,
      buildingType: building.buildingType,
      surfaceArea: building.surfaceArea ?? 0,
      floors: building.floors ?? 0,
      activityType: building.activityType,
      openingDaysPerWeek: technical.openingDaysPerWeek ?? 0,
      openingHoursPerDay: technical.openingHoursPerDay ?? 0,
      insulation: technical.insulation,
      glazingType: technical.glazingType,
      ventilation: technical.ventilation,
      climateZone: building.climateZone,
      heatingSystem: technical.heatingSystem,
      coolingSystem: technical.coolingSystem,
      conditionedCoverage: technical.conditionedCoverage,
      domesticHotWater: technical.domesticHotWater,
      equipmentCategories: technical.equipmentCategories.length
        ? technical.equipmentCategories
        : undefined,
      tariffType: consumption.tariffType,
      contractedPower: consumption.contractedPower ?? undefined,
      monthlyBillAmount: consumption.monthlyBillAmount ?? 0,
      hasRecentBill: consumption.hasRecentBill,
      recentBillConsumption: consumption.hasRecentBill
        ? consumption.recentBillConsumption ?? undefined
        : undefined,
      billAttachmentUrl: consumption.billAttachmentUrl || undefined,
      existingMeasures: technical.existingMeasures.length ? technical.existingMeasures : undefined,
      lightingType: technical.lightingType
    };
  }

  protected showError(path: string): boolean {
    const control = this.auditForm.get(path);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
