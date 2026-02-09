import { FormControl, FormGroup } from '@angular/forms';
import { BuildingTypes, ClimateZones } from '@shared';

export type InvoiceFieldName = 'hasInvoice';
export type LocationFieldName = 'address' | 'fullName' | 'companyName' | 'email' | 'phoneNumber';
export type ConsumptionFieldName =
  | 'measuredAmountTnd'
  | 'referenceMonth'
  | 'billAttachment'
  | 'tariffTension'
  | 'operatingHoursCase'
  | 'tariffRegime';
export type BuildingFieldName = 'buildingType' | 'climateZone';
export type PersonalFieldName = 'fullName' | 'companyName' | 'email' | 'phoneNumber';

export type LocationFormValue = {
  address: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
};

export type ConsumptionFormValue = {
  hasInvoice: 'yes' | 'no' | null;
  measuredAmountTnd: number | null;
  referenceMonth: number | null;
  billAttachment: File | null;
  /** 'BT' (Basse Tension) or 'MT' (Moyenne Tension) */
  tariffTension: 'BT' | 'MT';
  /** Operating hours case for MT: 'jour', 'jour_soir', or '24_7'. Null for BT. */
  operatingHoursCase: 'jour' | 'jour_soir' | '24_7' | null;
  /** MT tariff regime: 'uniforme' or 'horaire'. Null for BT. */
  tariffRegime: 'uniforme' | 'horaire' | null;
};

export type BuildingFormValue = {
  buildingType: BuildingTypes;
  climateZone: ClimateZones;
};

export type PersonalFormValue = {
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
};

export type AuditSolaireFormValue = {
  location: LocationFormValue;
  consumption: ConsumptionFormValue;
  building: BuildingFormValue;
  personal: PersonalFormValue;
};

export type LocationForm = {
  address: FormControl<string>;
  fullName: FormControl<string>;
  companyName: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
};

export type ConsumptionForm = {
  hasInvoice: FormControl<'yes' | 'no' | null>;
  measuredAmountTnd: FormControl<number | null>;
  referenceMonth: FormControl<number | null>;
  billAttachment: FormControl<File | null>;
  tariffTension: FormControl<'BT' | 'MT'>;
  operatingHoursCase: FormControl<'jour' | 'jour_soir' | '24_7' | null>;
  tariffRegime: FormControl<'uniforme' | 'horaire' | null>;
};

export type BuildingForm = {
  buildingType: FormControl<BuildingTypes>;
  climateZone: FormControl<ClimateZones>;
};

export type PersonalForm = {
  fullName: FormControl<string>;
  companyName: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
};

export type AuditSolaireFormControls = {
  location: FormGroup<LocationForm>;
  consumption: FormGroup<ConsumptionForm>;
  building: FormGroup<BuildingForm>;
  personal: FormGroup<PersonalForm>;
};

export type AuditSolaireFormGroup = FormGroup<AuditSolaireFormControls>;

export type FieldConfig<T extends string> = {
  control: T;
  label: string;
  type?: 'text' | 'number' | 'select';
  span?: boolean;
  options?: readonly string[];
  placeholderOption?: string;
  tooltip?: {
    title: string;
    description: string;
  };
};

export enum AuditSolaireFormStep {
  INVOICE = 1,
  BILL_UPLOAD = 2,
  BUILDING = 3,
  LOCATION = 4,
  REVIEW = 5
}

