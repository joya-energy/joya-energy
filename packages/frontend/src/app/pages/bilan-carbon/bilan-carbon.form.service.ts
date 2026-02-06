import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Governorates } from '@shared';
import type {
  GeneralForm,
  ElectricityForm,
  HeatForm,
  ColdForm,
  VehiclesForm,
  TravelForm,
  ITEquipmentForm,
  PersonalForm,
} from './bilan-carbon.types';

export interface BilanCarbonFormControls {
  general: FormGroup<GeneralForm>;
  electricity: FormGroup<ElectricityForm>;
  heat: FormGroup<HeatForm>;
  cold: FormGroup<ColdForm>;
  vehicles: FormGroup<VehiclesForm>;
  travel: FormGroup<TravelForm>;
  itEquipment: FormGroup<ITEquipmentForm>;
  personal: FormGroup<PersonalForm>;
}

@Injectable({ providedIn: 'root' })
export class BilanCarbonFormService {
  readonly governorates = Object.values(Governorates) as string[];

  buildForm(): FormGroup<BilanCarbonFormControls> {
    return new FormGroup<BilanCarbonFormControls>({
      general: new FormGroup<GeneralForm>({
        companyName: new FormControl<string>('', { nonNullable: true }),
        sector: new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        cityGovernorate: new FormControl<string>('', { nonNullable: true }),
        zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        referenceYear: new FormControl<number | null>(new Date().getFullYear(), [
          Validators.required,
        ]),
        surfaceM2: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
        numberOfEmployees: new FormControl<number | null>(null, [Validators.min(0)]),
      }),
      electricity: new FormGroup<ElectricityForm>({
        monthlyBillAmountDt: new FormControl<number | null>(null, [
          Validators.required,
          Validators.min(0),
        ]),
        tariffType: new FormControl<string>('BT', { nonNullable: true }),
        referenceMonth: new FormControl<string | null>(null, [
          Validators.required,
          Validators.pattern(/^(1[0-2]|[1-9])$/),
        ]),
      }),
      heat: new FormGroup<HeatForm>({
        hasHeatUsages: new FormControl<boolean>(false, { nonNullable: true }),
        selectedHeatUsage: new FormControl<string | null>(null),
        selectedHeatEnergy: new FormControl<string | null>(null),
      }),
      cold: new FormGroup<ColdForm>({
        hasCold: new FormControl<boolean>(false, { nonNullable: true }),
        intensity: new FormControl<string>('Modérée', { nonNullable: true }),
        equipmentAge: new FormControl<string>('3-7 ans', { nonNullable: true }),
        maintenance: new FormControl<string>('NSP', { nonNullable: true }),
      }),
      vehicles: new FormGroup<VehiclesForm>({
        hasVehicles: new FormControl<boolean>(false, { nonNullable: true }),
        numberOfVehicles: new FormControl<number | null>(null, [Validators.min(0)]),
        kmPerVehiclePerYear: new FormControl<number | null>(null, [Validators.min(0)]),
        fuelType: new FormControl<string>('Diesel', { nonNullable: true }),
        usageType: new FormControl<string>('Déplacements légers', { nonNullable: true }),
      }),
      travel: new FormGroup<TravelForm>({
        planeFrequency: new FormControl<string | null>(null),
        trainFrequency: new FormControl<string | null>(null),
      }),
      itEquipment: new FormGroup<ITEquipmentForm>({
        laptopCount: new FormControl<number | null>(0, [Validators.min(0)]),
        desktopCount: new FormControl<number | null>(0, [Validators.min(0)]),
        screenCount: new FormControl<number | null>(0, [Validators.min(0)]),
        proPhoneCount: new FormControl<number | null>(0, [Validators.min(0)]),
      }),
      personal: new FormGroup<PersonalForm>({
        fullName: new FormControl<string>('', { nonNullable: true }),
        companyName: new FormControl<string>('', { nonNullable: true }),
        email: new FormControl<string>('', { nonNullable: true, validators: [Validators.email] }),
        phone: new FormControl<string>('', { nonNullable: true }),
      }),
    });
  }
}
