import {
  BuildingTypes,
  ClimateZones,
  Governorates
} from '@shared/enums/audit-general.enum';
import {
  ConditionedCoverage,
  CoolingSystemTypes,
  DomesticHotWaterTypes,
  GlazingTypes,
  HeatingSystemTypes,
  InsulationQualities,
  VentilationSystems
} from '@shared/enums/audit-batiment.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energy-tariff';
import { EquipmentCategories, ExistingMeasures, LightingTypes } from '@shared/enums/audit-usage.enum';
import {
  enumArray,
  optionalNumber,
  optionalUrl,
  requireBoolean,
  requireEmail,
  requireEnum,
  requireNumber,
  requireString
} from '../../common/validation.utils';
import { type AuditEnergetiqueCreateInput } from '../audit-energetique.service';

export type PayloadValue = string | number | boolean | string[] | number[] | null | undefined;
export type AuditRequestPayload = Record<string, PayloadValue>;

export interface ExtractedField<T> {
  value?: T;
}

export interface ExtractedAuditData {
  monthlyBillAmount?: ExtractedField<number>;
  recentBillConsumption?: ExtractedField<number>;
  tariffType?: ExtractedField<string>;
  contractedPower?: ExtractedField<number>;
  address?: ExtractedField<string>;
  governorate?: ExtractedField<string>;
}

const normalizeString = (value?: string): string | undefined => {
  return value?.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
};

const matchGovernorate = (value?: string): Governorates | undefined => {
  if (!value) return undefined;
  const normalized = normalizeString(value);
  return (Object.values(Governorates) as string[]).find((gov) => normalizeString(gov) === normalized) as
    | Governorates
    | undefined;
};

const mapExtractedField = <T>(field?: ExtractedField<T>): T | undefined => field?.value;

export const mergeExtractedValues = (
  body: AuditRequestPayload,
  extracted: ExtractedAuditData
): AuditRequestPayload => {
  const result: AuditRequestPayload = { ...body };

const setIfMissing = (field: keyof AuditRequestPayload, value?: PayloadValue): void => {
    if (value === null || value === undefined) return;
    const current = result[field];
    if (current === undefined || current === null || current === '') {
      result[field] = value;
    }
  };

  setIfMissing('monthlyBillAmount', mapExtractedField(extracted.monthlyBillAmount));
  setIfMissing('recentBillConsumption', mapExtractedField(extracted.recentBillConsumption));
  setIfMissing('tariffType', mapExtractedField(extracted.tariffType));
  setIfMissing('contractedPower', mapExtractedField(extracted.contractedPower));
  setIfMissing('address', mapExtractedField(extracted.address));
  setIfMissing('governorate', matchGovernorate(mapExtractedField(extracted.governorate)));

  if (result.hasRecentBill === undefined) {
    result.hasRecentBill = true;
  }

  return result;
};

export const sanitizeAuditPayload = (payload: AuditRequestPayload): AuditEnergetiqueCreateInput => {
  const hasRecentBill =
    payload.hasRecentBill === undefined ? true : requireBoolean(payload.hasRecentBill, 'hasRecentBill');

  const equipmentCategories = enumArray(EquipmentCategories, payload.equipmentCategories, 'equipmentCategories');

  const existingMeasures = enumArray(ExistingMeasures, payload.existingMeasures, 'existingMeasures');

  return {
    fullName: requireString(payload.fullName, 'fullName'),
    companyName: requireString(payload.companyName, 'companyName'),
    email: requireEmail(payload.email, 'email'),
    phoneNumber: requireString(payload.phoneNumber, 'phoneNumber'),
    address: requireString(payload.address, 'address'),
    governorate: requireEnum(Governorates, payload.governorate, 'governorate'),
    buildingType: requireEnum(BuildingTypes, payload.buildingType, 'buildingType'),
    surfaceArea: requireNumber(payload.surfaceArea, 'surfaceArea', { min: 0 }),
    floors: requireNumber(payload.floors, 'floors', { min: 0, integer: true }),
    activityType: requireString(payload.activityType, 'activityType'),
    openingDaysPerWeek: requireNumber(payload.openingDaysPerWeek, 'openingDaysPerWeek', {
      min: 1,
      max: 7,
      integer: true
    }),
    openingHoursPerDay: requireNumber(payload.openingHoursPerDay, 'openingHoursPerDay', {
      min: 1,
      max: 24,
      integer: true
    }),
    insulation: requireEnum(InsulationQualities, payload.insulation, 'insulation'),
    glazingType: requireEnum(GlazingTypes, payload.glazingType, 'glazingType'),
    ventilation: requireEnum(VentilationSystems, payload.ventilation, 'ventilation'),
    climateZone: requireEnum(ClimateZones, payload.climateZone, 'climateZone'),
    heatingSystem: requireEnum(HeatingSystemTypes, payload.heatingSystem, 'heatingSystem'),
    coolingSystem: requireEnum(CoolingSystemTypes, payload.coolingSystem, 'coolingSystem'),
    conditionedCoverage: requireEnum(ConditionedCoverage, payload.conditionedCoverage, 'conditionedCoverage'),
    domesticHotWater: requireEnum(DomesticHotWaterTypes, payload.domesticHotWater, 'domesticHotWater'),
    equipmentCategories,
    tariffType: requireEnum(EnergyTariffTypes, payload.tariffType, 'tariffType'),
    contractedPower: optionalNumber(payload.contractedPower, 'contractedPower', { min: 0 }),
    monthlyBillAmount: requireNumber(payload.monthlyBillAmount, 'monthlyBillAmount', { min: 0 }),
    hasRecentBill,
    recentBillConsumption: hasRecentBill
      ? requireNumber(payload.recentBillConsumption, 'recentBillConsumption', { min: 0 })
      : undefined,
    billAttachmentUrl: optionalUrl(payload.billAttachmentUrl, 'billAttachmentUrl'),
    existingMeasures,
    lightingType: requireEnum(LightingTypes, payload.lightingType, 'lightingType')
  };
};

