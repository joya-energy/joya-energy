 import { FormControl, FormGroup } from '@angular/forms';

export type NullableNumber = number | null;
export type StringArray = string[];
export type InputType = 'text' | 'email' | 'tel' | 'number';

export type PersonalFieldName = 'fullName' | 'companyName' | 'email' | 'phoneNumber' | 'address' | 'governorate';
export type ConsumptionFieldName = 'recentBillConsumption' | 'monthlyBillAmount' | 'contractedPower' | 'tariffType';
export type BuildingFieldName =
  | 'buildingType'
  | 'surfaceArea'
  | 'climateZone'
  | 'floors'
  | 'activityType';
export type TechnicalFieldName =
  | 'openingDaysPerWeek'
  | 'openingHoursPerDay'
  | 'insulation'
  | 'glazingType'
  | 'heatingSystem'
  | 'coolingSystem'
  | 'domesticHotWater'
  | 'ventilation'
  | 'lightingType'
  | 'conditionedCoverage'
  | 'equipmentCategories'
  | 'existingMeasures';

export type PersonalInfoForm = {
  fullName: FormControl<string>;
  companyName: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
  address: FormControl<string>;
  governorate: FormControl<string>;
};

export type ConsumptionForm = {
  recentBillConsumption: FormControl<NullableNumber>;
  monthlyBillAmount: FormControl<NullableNumber>;
  contractedPower: FormControl<NullableNumber>;
  tariffType: FormControl<string>;
  hasRecentBill: FormControl<boolean>;
  billAttachmentUrl: FormControl<string>;
};

export type BuildingForm = {
  buildingType: FormControl<string>;
  surfaceArea: FormControl<NullableNumber>;
  climateZone: FormControl<string>;
  floors: FormControl<NullableNumber>;
  activityType: FormControl<string>;
};

export type TechnicalForm = {
  openingDaysPerWeek: FormControl<NullableNumber>;
  openingHoursPerDay: FormControl<NullableNumber>;
  insulation: FormControl<string>;
  glazingType: FormControl<string>;
  ventilation: FormControl<string>;
  heatingSystem: FormControl<string>;
  coolingSystem: FormControl<string>;
  conditionedCoverage: FormControl<string>;
  domesticHotWater: FormControl<string>;
  equipmentCategories: FormControl<StringArray>;
  existingMeasures: FormControl<StringArray>;
  lightingType: FormControl<string>;
};

export type AuditFormControls = {
  personal: FormGroup<PersonalInfoForm>;
  consumption: FormGroup<ConsumptionForm>;
  building: FormGroup<BuildingForm>;
  technical: FormGroup<TechnicalForm>;
};

export type AuditFormGroup = FormGroup<AuditFormControls>;

export type AuditFormValue = {
  personal: { [K in keyof PersonalInfoForm]: PersonalInfoForm[K]['value'] };
  consumption: { [K in keyof ConsumptionForm]: ConsumptionForm[K]['value'] };
  building: { [K in keyof BuildingForm]: BuildingForm[K]['value'] };
  technical: { [K in keyof TechnicalForm]: TechnicalForm[K]['value'] };
};

export type FormStep = 1 | 2 | 3 | 4;

export interface FieldConfig<TControl extends string> {
  control: TControl;
  label: string;
  type?: InputType;
  placeholder?: string;
  placeholderOption?: string;
  span?: boolean;
  disabled?: boolean;
  options?: ReadonlyArray<string>;
  multiple?: boolean;
  tooltip?: FieldTooltip;
}

export interface FieldTooltip {
  title: string;
  description?: string;
  options?: ReadonlyArray<string>;
}

