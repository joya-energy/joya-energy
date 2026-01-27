import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { BUILDING_CARD_CONFIG, BuildingCardConfig } from '../../../shared/icons/audit-building-icons';
import { EnergyAuditFormValue, SimulatorStep, StepField } from '../types/energy-audit.types';

function getEnumValues<T extends Record<string, string | number>>(enumObj: T): ReadonlyArray<T[keyof T]> {
  return Object.values(enumObj).filter(
    (v): v is T[keyof T] => typeof v === "string" || typeof v === "number"
  ) as ReadonlyArray<T[keyof T]>;
}

@Injectable({
  providedIn: 'root'
})
export class EnergyAuditFormService {
  private fb = inject(FormBuilder);

  // Options from enums
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
  
  // Building card config
  readonly buildingCardConfig = BUILDING_CARD_CONFIG;

  // Validation constants
  private static readonly MINIMUM_NUMERIC_VALUE = 0;
  private static readonly MINIMUM_SURFACE_AREA = 1;
  private static readonly MINIMUM_OPENING_DAYS = 1;
  private static readonly MAXIMUM_OPENING_DAYS = 7;
  private static readonly MINIMUM_OPENING_HOURS = 1;
  private static readonly MAXIMUM_OPENING_HOURS = 24;
  
  // Phone number pattern: supports international (+ or 00) or local (8 digits)
  private static readonly PHONE_PATTERN = /^(\+|00)[0-9]{8,15}$|^[0-9]{8}$/;
  
  private static readonly FEATURED_BUILDING_TYPES: BuildingTypes[] = [
    BuildingTypes.CAFE_RESTAURANT,
    BuildingTypes.OFFICE_ADMIN_BANK,
    BuildingTypes.LIGHT_WORKSHOP,
    BuildingTypes.HOTEL_GUESTHOUSE,
    BuildingTypes.CLINIC_MEDICAL,
    BuildingTypes.HEAVY_FACTORY,
    BuildingTypes.SCHOOL_TRAINING,
    BuildingTypes.BEAUTY_CENTER,
  ];

  readonly buildingCategories = BUILDING_CARD_CONFIG.filter((config) =>
    EnergyAuditFormService.FEATURED_BUILDING_TYPES.includes(config.id)
  );

  buildForm(): FormGroup {
    const form = this.fb.group({});
    
    // Initialize all fields from steps with proper validators
    this.getSteps().forEach(step => {
      step.fields.forEach(field => {
        const validators = this.getValidatorsForField(field);
        // Initialize array fields with empty array, others with null
        const initialValue = (field.name === 'equipmentCategories' || field.name === 'existingMeasures') 
          ? ([] as string[]) 
          : null;
        form.addControl(field.name, this.fb.control(initialValue, validators));
      });
    });

    // Add hasExistingMeasures control for conditional existingMeasures field
    form.addControl('hasExistingMeasures', this.fb.control(null, [Validators.required]));

    // Set up conditional validation for existingMeasures
    form.get('hasExistingMeasures')?.valueChanges.subscribe(hasMeasures => {
      const existingMeasuresControl = form.get('existingMeasures');
      if (!existingMeasuresControl) return;
      
      if (hasMeasures === true) {
        existingMeasuresControl.setValidators([Validators.required]);
      } else if (hasMeasures === false) {
        existingMeasuresControl.clearValidators();
        form.patchValue({ existingMeasures: [] });
      }
      existingMeasuresControl.updateValueAndValidity({ emitEvent: false });
    });

    return form;
  }

  private getValidatorsForField(field: StepField): any[] {
    const validators: any[] = [Validators.required];

    // Email validation
    if (field.name === 'email') {
      validators.push(Validators.email);
    }

    // Phone number validation
    if (field.name === 'phoneNumber') {
      validators.push(Validators.pattern(EnergyAuditFormService.PHONE_PATTERN));
    }

    // Number field validations
    if (field.type === 'number') {
      // Surface area: min 1
      if (field.name === 'surfaceArea') {
        validators.push(Validators.min(EnergyAuditFormService.MINIMUM_SURFACE_AREA));
      }
      // Floors: min 0 (can be 0 for single-story)
      else if (field.name === 'floors') {
        validators.push(Validators.min(EnergyAuditFormService.MINIMUM_NUMERIC_VALUE));
      }
      // Opening days: 1-7
      else if (field.name === 'openingDaysPerWeek') {
        validators.push(
          Validators.min(EnergyAuditFormService.MINIMUM_OPENING_DAYS),
          Validators.max(EnergyAuditFormService.MAXIMUM_OPENING_DAYS)
        );
      }
      // Opening hours: 1-24
      else if (field.name === 'openingHoursPerDay') {
        validators.push(
          Validators.min(EnergyAuditFormService.MINIMUM_OPENING_HOURS),
          Validators.max(EnergyAuditFormService.MAXIMUM_OPENING_HOURS)
        );
      }
      // Consumption amounts: min 0
      else if (field.name === 'monthlyBillAmount') {
        validators.push(Validators.min(EnergyAuditFormService.MINIMUM_NUMERIC_VALUE));
      }
      // Default min for other numbers
      else if (field.min !== undefined) {
        validators.push(Validators.min(field.min));
      } else {
        validators.push(Validators.min(EnergyAuditFormService.MINIMUM_NUMERIC_VALUE));
      }

      // Max validation if specified
      if (field.max !== undefined) {
        validators.push(Validators.max(field.max));
      }
    }

    return validators;
  }

  getSteps(): SimulatorStep[] {
    return [
      {
        number: 1,
        title: 'Profil bâtiment et usages',
        description: 'Commencez par sélectionner le type de bâtiment et renseigner ses caractéristiques principales.',
        component: 'step-building',
        fields: [
          {
            name: 'buildingType',
            label: 'Type de bâtiment',
            type: 'box-icon',
            required: true,
            options: this.buildingCategories.map(cat => ({
              label: cat.label,
              value: cat.id,
              icon: cat.icon
            })),
            iconPosition: 'top'
          },
          {
            name: 'surfaceArea',
            label: 'Surface (m²)',
            type: 'number',
            required: true,
            placeholder: '0',
            tooltipTitle: 'Surface utile',
            tooltipDescription: 'Surface auditée en m² (SHON ou utile).'
          },
          {
            name: 'floors',
            label: 'Étages',
            type: 'number',
            required: true,
            placeholder: '0',
            tooltipTitle: 'Nombre d\'étages',
            tooltipDescription: 'Inclure rez-de-chaussée et niveaux techniques.'
          },
          {
            name: 'activityType',
            label: 'Activité',
            type: 'box',
            required: true,
            options: this.activityTypes.map(opt => opt.toString()),
            useDropdown: true, // Use dropdown for long text options
            tooltipTitle: 'Activité',
            tooltipDescription: 'Usage principal (ex. bureaux, commerce).'
          },
          {
            name: 'climateZone',
            label: 'Zone climatique',
            type: 'box',
            required: true,
            options: this.climateZones.map(opt => opt.toString()),
            tooltipTitle: 'Zone climatique',
            tooltipDescription: 'Zone officielle utilisée pour le dimensionnement.'
          }
        ]
      },
      {
        number: 2,
        title: 'Équipements & Usages',
        description: 'Renseignez les équipements et les usages de votre bâtiment.',
        component: 'step-technical',
        fields: [
          {
            name: 'openingDaysPerWeek',
            label: 'Jours / semaine',
            type: 'number',
            required: true,
            placeholder: '0',
            min: 1,
            max: 7,
            shortInput: true,
            tooltipTitle: 'Jours d\'ouverture',
            tooltipDescription: 'Nombre moyen de jours d\'activité par semaine.'
          },
          {
            name: 'openingHoursPerDay',
            label: 'Heures / jour',
            type: 'number',
            required: true,
            placeholder: '0',
            min: 1,
            max: 24,
            shortInput: true,
            tooltipTitle: 'Heures d\'ouverture',
            tooltipDescription: 'Plage quotidienne moyenne (h/jour).'
          },
          {
            name: 'insulation',
            label: 'Isolation',
            type: 'box',
            required: true,
            options: this.insulationOptions.map(opt => opt.toString()),
            tooltipTitle: 'Isolation',
            tooltipDescription: 'Niveau global des parois.'
          },
          {
            name: 'glazingType',
            label: 'Vitrage',
            type: 'box',
            required: true,
            options: this.glazingOptions.map(opt => opt.toString()),
            tooltipTitle: 'Type de vitrage',
            tooltipDescription: 'Simple, double ou performant.'
          },
          {
            name: 'heatingSystem',
            label: 'Chauffage',
            type: 'box',
            required: true,
            options: this.heatingOptions.map(opt => opt.toString()),
            tooltipTitle: 'Chauffage',
            tooltipDescription: 'Équipement ou énergie dominante.'
          },
          {
            name: 'coolingSystem',
            label: 'Climatisation',
            type: 'box',
            required: true,
            options: this.coolingOptions.map(opt => opt.toString()),
            tooltipTitle: 'Climatisation',
            tooltipDescription: 'Système de froid principal.'
          }
        ]
      },
      {
        number: 3,
        title: 'Équipements complémentaires',
        description: 'Complétez les informations sur les équipements complémentaires.',
        component: 'step-equipment',
        fields: [
          {
            name: 'domesticHotWater',
            label: 'Eau chaude sanitaire',
            type: 'box',
            required: true,
            options: this.hotWaterOptions.map(opt => opt.toString()),
            tooltipTitle: 'Eau chaude sanitaire',
            tooltipDescription: 'Mode de production de l\'ECS.'
          },
          {
            name: 'ventilation',
            label: 'Ventilation',
            type: 'box',
            required: true,
            options: this.ventilationOptions.map(opt => opt.toString()),
            tooltipTitle: 'Ventilation',
            tooltipDescription: 'Système principal (naturelle ou mécanique).'
          },
          {
            name: 'lightingType',
            label: 'Éclairage',
            type: 'box',
            required: true,
            options: this.lightingOptions.map(opt => opt.toString()),
            tooltipTitle: 'Type d\'éclairage',
            tooltipDescription: 'Technologie dominante (LED, fluocompacte...).'
          },
          {
            name: 'conditionedCoverage',
            label: 'Couverture climatique',
            type: 'box',
            required: true,
            options: this.coverageOptions.map(opt => opt.toString()),
            tooltipTitle: 'Surface climatisée',
            tooltipDescription: 'Part des zones chauffées ou rafraîchies.'
          },
          {
            name: 'equipmentCategories',
            label: 'Catégories d\'équipements',
            type: 'box',
            required: true,
            options: this.equipmentOptions.map(opt => opt.toString()),
            useDropdown: true,
            tooltipTitle: 'Catégories d\'équipements',
            tooltipDescription: 'Catégories d\'équipements consommateurs d\'énergie présents sur le site.'
          },
          {
            name: 'hasExistingMeasures',
            label: 'Mesures existantes',
            type: 'text', // Not rendered as select - we use choice cards
            required: true,
            tooltipTitle: 'Mesures existantes',
            tooltipDescription: 'Avez-vous déjà mis en place des mesures d\'efficacité énergétique ?'
          },
          {
            name: 'existingMeasures',
            label: 'Sélectionnez les mesures existantes',
            type: 'box',
            required: false, // Conditionally required based on hasExistingMeasures
            options: this.existingMeasuresOptions.map(opt => opt.toString()),
            useDropdown: true,
            condition: (form: any) => form.hasExistingMeasures === true,
            tooltipTitle: 'Mesures existantes',
            tooltipDescription: 'Mesures existantes sur le site.'
          }
        ]
      },
      {
        number: 4,
        title: 'Informations générales',
        description: 'Complétez vos informations personnelles et de consommation.',
        component: 'step-personal',
        fields: [
          {
            name: 'fullName',
            label: 'Nom complet',
            type: 'text',
            required: true,
            placeholder: 'Entrez votre nom complet',
            tooltipTitle: 'Nom complet',
            tooltipDescription: 'Personne référente pour l\'audit.'
          },
          {
            name: 'companyName',
            label: 'Entreprise',
            type: 'text',
            required: true,
            placeholder: 'Entrez le nom de l\'entreprise',
            tooltipTitle: 'Raison sociale',
            tooltipDescription: 'Nom légal ou enseigne du site.'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            required: true,
            placeholder: 'email@example.com',
            tooltipTitle: 'Email de contact',
            tooltipDescription: 'Adresse utilisée pour l\'envoi des résultats.'
          },
          {
            name: 'phoneNumber',
            label: 'Téléphone',
            type: 'text',
            required: true,
            placeholder: 'Entrez votre numéro de téléphone',
            tooltipTitle: 'Téléphone',
            tooltipDescription: 'Numéro pour les échanges techniques.'
          },
          {
            name: 'address',
            label: 'Adresse',
            type: 'text',
            required: true,
            placeholder: 'Entrez l\'adresse du site',
            icon: 'lucideMapPin',
            tooltipTitle: 'Adresse du site',
            tooltipDescription: 'Localisation du bâtiment audité.'
          },
          {
            name: 'governorate',
            label: 'Gouvernorat',
            type: 'box',
            required: true,
            options: this.governorates.map(opt => opt.toString()),
            tooltipTitle: 'Gouvernorat',
            tooltipDescription: 'Région administrative du site.'
          },
          {
            name: 'monthlyBillAmount',
            label: 'Montant (TND)',
            type: 'number',
            required: true,
            placeholder: '0',
            tooltipTitle: 'Montant mensuel',
            tooltipDescription: 'Total TTC payé sur la facture.'
          },
          {
            name: 'tariffType',
            label: 'Type tarifaire',
            type: 'box',
            required: true,
            options: this.tariffOptions.map(opt => opt.toString()),
            tooltipTitle: 'Type tarifaire',
            tooltipDescription: 'Barème appliqué (ex. BT, MT, pointe).'
          },
          {
            name: 'referenceMonth',
            label: 'Mois de référence',
            type: 'select',
            required: true,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            useDropdown: true,
            tooltipTitle: 'Mois de référence',
            tooltipDescription: 'Mois de référence pour la facture utilisée.'
          }
        ]
      },
      {
        number: 5,
        title: 'Résultats',
        isResult: true,
        fields: []
      }
    ];
  }

  getDefaultFormValue(): EnergyAuditFormValue {
    return {};
  }
}
