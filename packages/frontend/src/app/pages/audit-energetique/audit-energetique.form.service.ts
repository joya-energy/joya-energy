import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  BuildingTypes,
  ClimateZones,
  ConditionedCoverage,
  CoolingSystemTypes,
  DomesticHotWaterTypes,
  EnergyTariffTypes,
  EquipmentCategories,
  GlazingTypes,
  Governorates,
  HeatingSystemTypes,
  InsulationQualities,
  LightingTypes,
  VentilationSystems,
  ActivityTypes,
  ExistingMeasures
} from '@shared';
import {
  AuditFormControls,
  AuditFormGroup,
  AuditFormValue,
  BuildingFieldName,
  BuildingForm,
  ConsumptionFieldName,
  ConsumptionForm,
  FieldConfig,
  NullableNumber,
  PersonalFieldName,
  PersonalInfoForm,
  StringArray,
  TechnicalFieldName,
  TechnicalForm
} from './audit-energetique.types';

const DEFAULT_PLACEHOLDER_OPTION = 'Sélectionnez...';
const MINIMUM_NUMERIC_VALUE = 0;
const MINIMUM_SURFACE_AREA = 1;
const MINIMUM_OPENING_DAYS = 1;
const MAXIMUM_OPENING_DAYS = 7;
const MINIMUM_OPENING_HOURS = 1;
const MAXIMUM_OPENING_HOURS = 24;

function getEnumValues<T extends Record<string, string | number>>(enumObj: T): ReadonlyArray<T[keyof T]> {
  return Object.values(enumObj).filter(
    (v): v is T[keyof T] => typeof v === "string" || typeof v === "number"
  ) as ReadonlyArray<T[keyof T]>;
}



@Injectable({ providedIn: 'root' })
export class AuditFormService {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Options
  readonly governorates = getEnumValues(Governorates);
  readonly insulationOptions = getEnumValues(InsulationQualities);
  readonly glazingOptions = getEnumValues(GlazingTypes);
  readonly ventilationOptions = getEnumValues(VentilationSystems);
  readonly climateZones = getEnumValues(ClimateZones);
  readonly heatingOptions = getEnumValues(HeatingSystemTypes);
  readonly coolingOptions = getEnumValues(CoolingSystemTypes);
  readonly coverageOptions = getEnumValues(ConditionedCoverage);
  readonly hotWaterOptions = getEnumValues(DomesticHotWaterTypes);
  readonly equipmentOptions = getEnumValues(EquipmentCategories);
  readonly existingMeasuresOptions = getEnumValues(ExistingMeasures);
  readonly tariffOptions = getEnumValues(EnergyTariffTypes);
  readonly lightingOptions = getEnumValues(LightingTypes);
  readonly activityTypes = getEnumValues(ActivityTypes);
  readonly buildingTypes = getEnumValues(BuildingTypes);
  // Field Configs
  readonly personalFields: FieldConfig<PersonalFieldName>[] = [
    {
      control: 'fullName',
      label: 'Nom complet *',
      span: true,
      tooltip: { title: 'Nom complet', description: 'Personne référente pour l’audit.' }
    },
    {
      control: 'companyName',
      label: 'Entreprise *',
      span: true,
      tooltip: { title: 'Raison sociale', description: 'Nom légal ou enseigne du site.' }
    },
    {
      control: 'email',
      label: 'Email *',
      type: 'email',
      tooltip: { title: 'Email de contact', description: 'Adresse utilisée pour l’envoi des résultats.' }
    },
    {
      control: 'phoneNumber',
      label: 'Téléphone *',
      type: 'tel',
      tooltip: { title: 'Téléphone', description: 'Numéro pour les échanges techniques.' }
    },
    {
      control: 'address',
      label: 'Adresse *',
      tooltip: { title: 'Adresse du site', description: 'Localisation du bâtiment audité.' }
    },
    {
      control: 'governorate',
      label: 'Gouvernorat *',
      options: this.governorates,
      placeholderOption: DEFAULT_PLACEHOLDER_OPTION,
      tooltip: { title: 'Gouvernorat', description: 'Région administrative du site.' }
    }
  ];

  readonly consumptionFields: FieldConfig<ConsumptionFieldName>[] = [
    {
      control: 'recentBillConsumption',
      label: 'Consommation (kWh) *',
      type: 'number',
      tooltip: { title: 'Consommation facture', description: 'kWh figurant sur la dernière facture.' }
    },
    {
      control: 'monthlyBillAmount',
      label: 'Montant (TND) *',
      type: 'number',
      tooltip: { title: 'Montant mensuel', description: 'Total TTC payé sur la facture.' }
    },
    {
      control: 'contractedPower',
      label: 'Puissance (kVA) *',
      type: 'number',
      tooltip: { title: 'Puissance souscrite', description: 'Valeur indiquée sur l’abonnement.' }
    },
    {
      control: 'tariffType',
      label: 'Type tarifaire *',
      options: this.tariffOptions,
      placeholderOption: DEFAULT_PLACEHOLDER_OPTION,
      tooltip: { title: 'Type tarifaire', description: 'Barème appliqué (ex. BT, MT, pointe).' }
    }
  ];

  readonly buildingFields: FieldConfig<BuildingFieldName>[] = [
    {
      control: 'surfaceArea',
      label: 'Surface (m²) *',
      type: 'number',
      tooltip: { title: 'Surface utile', description: 'Surface auditée en m² (SHON ou utile).' }
    },
    {
      control: 'floors',
      label: 'Étages *',
      type: 'number',
      tooltip: { title: 'Nombre d’étages', description: 'Inclure rez-de-chaussée et niveaux techniques.' }
    },
    {
      control: 'activityType',
      label: 'Activité *',
      options: this.activityTypes,
      placeholderOption: DEFAULT_PLACEHOLDER_OPTION,
      tooltip: { title: 'Activité', description: 'Usage principal (ex. bureaux, commerce).' }
    },
    {
      control: 'climateZone',
      label: 'Zone climatique *',
      options: this.climateZones,
      placeholderOption: DEFAULT_PLACEHOLDER_OPTION,
      tooltip: { title: 'Zone climatique', description: 'Zone officielle utilisée pour le dimensionnement.' }
    }
  ];

  readonly technicalFields: FieldConfig<TechnicalFieldName>[] = [
    {
      control: 'openingDaysPerWeek',
      label: 'Jours / semaine',
      type: 'number',
      tooltip: { title: 'Jours d’ouverture', description: 'Nombre moyen de jours d’activité par semaine.' }
    },
    {
      control: 'openingHoursPerDay',
      label: 'Heures / jour',
      type: 'number',
      tooltip: { title: 'Heures d’ouverture', description: 'Plage quotidienne moyenne (h/jour).' }
    },
    {
      control: 'insulation',
      label: 'Isolation',
      options: this.insulationOptions,
      tooltip: { title: 'Isolation', description: 'Niveau global des parois.' }
    },
    {
      control: 'glazingType',
      label: 'Vitrage',
      options: this.glazingOptions,
      tooltip: { title: 'Type de vitrage', description: 'Simple, double ou performant.' }
    },
    {
      control: 'heatingSystem',
      label: 'Chauffage',
      options: this.heatingOptions,
      tooltip: { title: 'Chauffage', description: 'Équipement ou énergie dominante.' }
    },
    {
      control: 'coolingSystem',
      label: 'Climatisation',
      options: this.coolingOptions,
      tooltip: { title: 'Climatisation', description: 'Système de froid principal.' }
    },
    {
      control: 'domesticHotWater',
      label: 'Eau chaude sanitaire',
      options: this.hotWaterOptions,
      tooltip: { title: 'Eau chaude sanitaire', description: 'Mode de production de l’ECS.' }
    },
    {
      control: 'ventilation',
      label: 'Ventilation',
      options: this.ventilationOptions,
      tooltip: { title: 'Ventilation', description: 'Système principal (naturelle ou mécanique).' }
    },
    {
      control: 'lightingType',
      label: 'Éclairage',
      options: this.lightingOptions,
      tooltip: { title: 'Type d’éclairage', description: 'Technologie dominante (LED, fluocompacte...).' }
    },
    {
      control: 'conditionedCoverage',
      label: 'Couverture climatique *',
      options: this.coverageOptions,
      tooltip: { title: 'Surface climatisée', description: 'Part des zones chauffées ou rafraîchies.' }
    },
    {
      control: 'equipmentCategories',
      label: 'Catégories d\'équipements *',
      options: this.equipmentOptions.map(option => option.toString()),
      multiple: true,
      tooltip: { title: 'Catégories d\'équipements', description: 'Catégories d\'équipements consommateurs d\'énergie présents sur le site.' }
    },
    {
      control: 'existingMeasures',
      label: 'Mesures existantes',
      options: this.existingMeasuresOptions,
      multiple: true,
      tooltip: { title: 'Mesures existantes', description: 'Mesures existantes sur le site.', options: this.existingMeasuresOptions }
    }
  ];

  buildForm(): AuditFormGroup {
    const form = this.fb.nonNullable.group<AuditFormControls>({
      personal: this.buildPersonalGroup(),
      consumption: this.buildConsumptionGroup(),
      building: this.buildBuildingGroup(),
      technical: this.buildTechnicalGroup()
    });

    // Setup dynamic validation
    this.setupConditionalValidation(form.controls.consumption);

    return form;
  }

  getDefaultFormValue(): AuditFormValue {
    return {
      personal: this.getDefaultPersonalInfo(),
      consumption: this.getDefaultConsumptionInfo(),
      building: this.getDefaultBuildingInfo(),
      technical: this.getDefaultTechnicalInfo()
    };
  }

  private getDefaultPersonalInfo(): AuditFormValue['personal'] {
    return {
      fullName: '',
      companyName: '',
      email: '',
      phoneNumber: '',
      address: '',
      governorate: ''
    };
  }

  private getDefaultConsumptionInfo(): AuditFormValue['consumption'] {
    return {
      recentBillConsumption: null,
      monthlyBillAmount: null,
      contractedPower: null,
      tariffType: '',
      hasRecentBill: true,
      billAttachmentUrl: ''
    };
  }

  private getDefaultBuildingInfo(): AuditFormValue['building'] {
    return {
      buildingType: '',
      surfaceArea: null,
      climateZone: '',
      floors: null,
      activityType: ''
    };
  }

  private getDefaultTechnicalInfo(): AuditFormValue['technical'] {
    return {
      openingDaysPerWeek: null,
      openingHoursPerDay: null,
      insulation: '',
      glazingType: '',
      ventilation: '',
      heatingSystem: '',
      coolingSystem: '',
      conditionedCoverage: '',
      domesticHotWater: '',
      equipmentCategories: [],
      existingMeasures: [],
      lightingType: ''
    };
  }

  private buildPersonalGroup(): FormGroup<PersonalInfoForm> {
    return this.fb.group<PersonalInfoForm>({
      fullName: this.fb.nonNullable.control('', [Validators.required]),
      companyName: this.fb.nonNullable.control('', [Validators.required]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      phoneNumber: this.fb.nonNullable.control('', [Validators.required]),
      address: this.fb.nonNullable.control('', [Validators.required]),
      governorate: this.fb.nonNullable.control('', [Validators.required])
    });
  }

  private buildConsumptionGroup(): FormGroup<ConsumptionForm> {
    return this.fb.group<ConsumptionForm>({
      recentBillConsumption: this.fb.control<NullableNumber>(null, {
        validators: [Validators.min(MINIMUM_NUMERIC_VALUE)]
      }),
      monthlyBillAmount: this.fb.control<NullableNumber>(null, {
        validators: [Validators.required, Validators.min(MINIMUM_NUMERIC_VALUE)]
      }),
      contractedPower: this.fb.control<NullableNumber>(null, {
        validators: [Validators.min(MINIMUM_NUMERIC_VALUE)]
      }),
      tariffType: this.fb.nonNullable.control('', [Validators.required]),
      hasRecentBill: this.fb.nonNullable.control(true, [Validators.required]),
      billAttachmentUrl: this.fb.nonNullable.control('')
    });
  }

  private buildBuildingGroup(): FormGroup<BuildingForm> {
    return this.fb.group<BuildingForm>({
      buildingType: this.fb.nonNullable.control('', [Validators.required]),
      surfaceArea: this.fb.control<NullableNumber>(null, {
        validators: [Validators.required, Validators.min(MINIMUM_SURFACE_AREA)]
      }),
      climateZone: this.fb.nonNullable.control('', [Validators.required]),
      floors: this.fb.control<NullableNumber>(null, {
        validators: [Validators.required, Validators.min(MINIMUM_NUMERIC_VALUE)]
      }),
      activityType: this.fb.nonNullable.control('', [Validators.required])
    });
  }

  private buildTechnicalGroup(): FormGroup<TechnicalForm> {
    return this.fb.group<TechnicalForm>({
      openingDaysPerWeek: this.fb.control<NullableNumber>(null, {
        validators: [
          Validators.required,
          Validators.min(MINIMUM_OPENING_DAYS),
          Validators.max(MAXIMUM_OPENING_DAYS)
        ]
      }),
      openingHoursPerDay: this.fb.control<NullableNumber>(null, {
        validators: [
          Validators.required,
          Validators.min(MINIMUM_OPENING_HOURS),
          Validators.max(MAXIMUM_OPENING_HOURS)
        ]
      }),
      insulation: this.fb.nonNullable.control('', [Validators.required]),
      glazingType: this.fb.nonNullable.control('', [Validators.required]),
      ventilation: this.fb.nonNullable.control('', [Validators.required]),
      heatingSystem: this.fb.nonNullable.control('', [Validators.required]),
      coolingSystem: this.fb.nonNullable.control('', [Validators.required]),
      conditionedCoverage: this.fb.nonNullable.control('', [Validators.required]),
      domesticHotWater: this.fb.nonNullable.control('', [Validators.required]),
      equipmentCategories: this.fb.nonNullable.control<StringArray>([]),
      existingMeasures: this.fb.nonNullable.control<StringArray>([]),
      lightingType: this.fb.nonNullable.control('', [Validators.required])
    });
  }

  private setupConditionalValidation(group: FormGroup<ConsumptionForm>): void {
    const hasRecentBillControl = group.controls.hasRecentBill;
    const recentConsumptionControl = group.controls.recentBillConsumption;

    this.applyRecentBillValidation(recentConsumptionControl, hasRecentBillControl.value);

    hasRecentBillControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((hasRecentBill) =>
        this.applyRecentBillValidation(recentConsumptionControl, hasRecentBill)
      );
  }

  private applyRecentBillValidation(
    control: ConsumptionForm['recentBillConsumption'],
    hasRecentBill: boolean | null
  ): void {
    if (hasRecentBill) {
      control.addValidators(Validators.required);
    } else {
      control.removeValidators(Validators.required);
      control.setValue(null);
    }

    control.updateValueAndValidity();
  }
}

