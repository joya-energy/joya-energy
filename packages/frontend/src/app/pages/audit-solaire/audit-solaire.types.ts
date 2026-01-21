import { FormControl, FormGroup } from '@angular/forms';
import { BuildingTypes, ClimateZones } from '@shared';

export type InvoiceFieldName = 'hasInvoice';
export type LocationFieldName = 'address' | 'fullName' | 'companyName' | 'email' | 'phoneNumber';
export type ConsumptionFieldName = 'measuredAmountTnd' | 'referenceMonth' | 'billAttachment';
export type BuildingFieldName = 'buildingType' | 'climateZone';

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
};

export type BuildingFormValue = {
  buildingType: BuildingTypes;
  climateZone: ClimateZones;
};

export type AuditSolaireFormValue = {
  location: LocationFormValue;
  consumption: ConsumptionFormValue;
  building: BuildingFormValue;
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
};

export type BuildingForm = {
  buildingType: FormControl<BuildingTypes>;
  climateZone: FormControl<ClimateZones>;
};

export type AuditSolaireFormControls = {
  location: FormGroup<LocationForm>;
  consumption: FormGroup<ConsumptionForm>;
  building: FormGroup<BuildingForm>;
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

