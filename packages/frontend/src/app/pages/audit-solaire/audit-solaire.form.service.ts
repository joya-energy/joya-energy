import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ClimateZones, BuildingTypes } from '@shared';
import {
  AuditSolaireFormControls,
  AuditSolaireFormGroup,
  FieldConfig,
  LocationFieldName,
  ConsumptionFieldName,
  BuildingFieldName,
  ConsumptionForm,
  BuildingForm
} from './audit-solaire.types';

const DEFAULT_PLACEHOLDER_OPTION = 'Sélectionnez...';
const MIN_NUMERIC = 0;
const MIN_MONTH = 1;
const MAX_MONTH = 12;

// Custom validator to ensure buildingType/climateZone is a valid enum value (not an empty object)
function enumValidator(enumObject: Record<string, string>): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    // Check if value is a valid enum string (not an object or empty)
    if (typeof value !== 'string' || !Object.values(enumObject).includes(value)) {
      return { invalidEnum: { value } };
    }
    return null;
  };
}

function extractEnumValues<T extends Record<string, string | number>>(enumObject: T): ReadonlyArray<T[keyof T]> {
  return Object.values(enumObject).filter(
    (value): value is T[keyof T] => typeof value === 'string' || typeof value === 'number'
  ) as ReadonlyArray<T[keyof T]>;
}

@Injectable({ providedIn: 'root' })
export class AuditSolaireFormService {
  private fb = inject(FormBuilder);

  readonly buildingTypes = extractEnumValues(BuildingTypes);
  readonly climateZones = extractEnumValues(ClimateZones);

  readonly locationFields: FieldConfig<LocationFieldName>[] = [
    {
      control: 'fullName',
      label: 'Nom complet',
      type: 'text',
      tooltip: { title: 'Contact', description: 'Nom et prénom du contact.' }
    },
    {
      control: 'companyName',
      label: 'Nom de l’entreprise',
      type: 'text',
      tooltip: { title: 'Entreprise', description: 'Nom de l’entreprise (optionnel si particulier).' }
    },
    {
      control: 'email',
      label: 'Email',
      type: 'text',
      tooltip: { title: 'Email', description: 'Adresse email pour l’envoi du rapport PV.' }
    },
    {
      control: 'phoneNumber',
      label: 'Téléphone',
      type: 'text',
      tooltip: { title: 'Téléphone', description: 'Numéro de téléphone du contact.' }
    },
    {
      control: 'address',
      label: 'Adresse complète du bâtiment',
      type: 'text',
      tooltip: { title: 'Lieu', description: 'Adresse précise pour estimer l’ensoleillement.' }
    }
  ];

  readonly months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ] as const;

  readonly consumptionFields: FieldConfig<ConsumptionFieldName>[] = [
    {
      control: 'measuredAmountTnd',
      label: 'Montant mensuel (TND)',
      type: 'number',
      tooltip: { title: 'Facture', description: 'Montant total de votre dernière facture d\'électricité.' }
    },
    {
      control: 'referenceMonth',
      label: 'Mois de référence',
      type: 'select',
      options: this.months.map(m => m.label),
      placeholderOption: 'Sélectionnez le mois',
      tooltip: { title: 'Mois', description: 'Mois durant lequel la facture a été établie.' }
    }
  ];

  readonly buildingFields: FieldConfig<BuildingFieldName>[] = [
    {
      control: 'climateZone',
      label: 'Zone climatique',
      options: this.climateZones,
      placeholderOption: DEFAULT_PLACEHOLDER_OPTION,
      tooltip: { title: 'Climat', description: 'Choisissez la zone (Nord, Centre, Sud).' }
    }

  ];

  buildForm(): AuditSolaireFormGroup {
    return this.fb.group<AuditSolaireFormControls>({
      location: this.fb.group({
        fullName: this.fb.nonNullable.control('', [Validators.required]),
        companyName: this.fb.nonNullable.control('', [Validators.required]),
        email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
        phoneNumber: this.fb.nonNullable.control('', [Validators.required]),
        address: this.fb.nonNullable.control('', [Validators.required])
      }),
      consumption: this.fb.group<ConsumptionForm>({
        hasInvoice: this.fb.nonNullable.control<'yes' | 'no' | null>(null, [Validators.required]),
        measuredAmountTnd: this.fb.control<number | null>(null, [Validators.required, Validators.min(MIN_NUMERIC)]),
        referenceMonth: this.fb.control<number | null>(null, [
          Validators.required,
          Validators.min(MIN_MONTH),
          Validators.max(MAX_MONTH)
        ]),
        billAttachment: this.fb.control<File | null>(null)
      }),
      building: this.fb.group({
        buildingType: this.fb.nonNullable.control<BuildingTypes>({} as BuildingTypes, [
          Validators.required,
          enumValidator(BuildingTypes)
        ]) as FormControl<BuildingTypes>,
        climateZone: this.fb.nonNullable.control<ClimateZones>({} as ClimateZones, [
          Validators.required,
          enumValidator(ClimateZones)
        ]) as FormControl<ClimateZones>
      }) as FormGroup<BuildingForm>
    });
  }
}

