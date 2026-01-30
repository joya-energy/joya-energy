/**
 * Carbon simulation domain constants
 * Used by carbon-simulator helpers for Bilan Carbone calculations.
 */

import { BuildingTypes } from '@shared/enums/audit-general.enum';

// ─── Thermal (Scope 1) ─────────────────────────────────────────────────────
/** r_th: ratio of thermal consumption to electricity by sector. Formula: kWh_th_base = E_annuel × r_th */
export const THERMAL_RATIO_BY_SECTOR: Record<string, number> = {
  [BuildingTypes.OFFICE_ADMIN_BANK]: 0.15,
  [BuildingTypes.SERVICE]: 0.1,
  [BuildingTypes.CAFE_RESTAURANT]: 0.6,
  [BuildingTypes.HOTEL_GUESTHOUSE]: 0.5,
  [BuildingTypes.CLINIC_MEDICAL]: 0.35,
  [BuildingTypes.LIGHT_WORKSHOP]: 0.25,
  [BuildingTypes.FOOD_INDUSTRY]: 1.0,
  [BuildingTypes.PLASTIC_INJECTION]: 0.2,
  [BuildingTypes.TEXTILE_PACKAGING]: 0.4,
  [BuildingTypes.HEAVY_FACTORY]: 0.8,
  [BuildingTypes.COLD_AGRO_INDUSTRY]: 0.25,
  [BuildingTypes.BEAUTY_CENTER]: 0.15,
  [BuildingTypes.SCHOOL_TRAINING]: 0.2,
};

/** Weights (w) for heat usages — C_usages = 0.6 + Σw, clamped [0.8, 1.6] */
export const HEAT_USAGE_COEFFICIENTS: Record<string, number> = {
  DOMESTIC_HOT_WATER: 0.25,
  COOKING_KITCHEN: 0.2,
  INDUSTRIAL_PROCESS: 0.4,
  SPACE_HEATING: 0.35,
};

// ─── Carbon emission factors (kgCO2e per unit) ──────────────────────────────
export const CARBON_EMISSION_FACTORS = {
  /** Electricity (kgCO2e/kWh) */
  ELECTRICITY: 0.36,
  /** Natural gas (kgCO2e/kWh) */
  NATURAL_GAS: 0.206,
  /** LPG (kgCO2e/kWh) */
  LPG: 0.234,
  /** Thermal mix / diesel proxy (kgCO2e/kWh) */
  THERMAL_MIX: 0.324,
} as const;

// ─── Electricity / STEG ─────────────────────────────────────────────────────
/** STEG MT tariff rates (DT/kWh) */
export const STEG_MT_TARIFFS = {
  UNIFORME: { rateDtPerKwh: 0.35 },
  HORAIRE: { rateDtPerKwh: 0.32 },
} as const;

/** Default average electricity price for BT (DT/kWh) */
export const DEFAULT_AVERAGE_ELECTRICITY_PRICE_DT_PER_KWH = 0.391;

// ─── Cold / refrigeration (Scope 1) ─────────────────────────────────────────
export enum ColdType {
  COMFORT = 'Confort',
  COMMERCIAL = 'Commercial',
  MIXED = 'Mixte',
  INDUSTRIAL = 'Industriel',
}

/** Deduced cold type by building sector */
export const COLD_TYPE_BY_SECTOR: Record<string, ColdType> = {
  [BuildingTypes.OFFICE_ADMIN_BANK]: ColdType.COMFORT,
  [BuildingTypes.LIGHT_WORKSHOP]: ColdType.COMFORT,
  [BuildingTypes.TEXTILE_PACKAGING]: ColdType.COMFORT,
  [BuildingTypes.SERVICE]: ColdType.COMMERCIAL,
  [BuildingTypes.CAFE_RESTAURANT]: ColdType.MIXED,
  [BuildingTypes.HOTEL_GUESTHOUSE]: ColdType.MIXED,
  [BuildingTypes.CLINIC_MEDICAL]: ColdType.MIXED,
  [BuildingTypes.FOOD_INDUSTRY]: ColdType.INDUSTRIAL,
  [BuildingTypes.COLD_AGRO_INDUSTRY]: ColdType.INDUSTRIAL,
  [BuildingTypes.PLASTIC_INJECTION]: ColdType.INDUSTRIAL,
  [BuildingTypes.HEAVY_FACTORY]: ColdType.INDUSTRIAL,
  [BuildingTypes.BEAUTY_CENTER]: ColdType.MIXED,
  [BuildingTypes.SCHOOL_TRAINING]: ColdType.COMFORT,
};

export interface ColdTypeParameters {
  surfacePerUnitM2: number;
  unitChargeKg: number;
  annualLeakRate: number;
  averageGwp: number;
}

export const COLD_TYPE_PARAMETERS: Record<ColdType, ColdTypeParameters> = {
  [ColdType.COMFORT]: {
    surfacePerUnitM2: 50,
    unitChargeKg: 3,
    annualLeakRate: 0.05,
    averageGwp: 2100,
  },
  [ColdType.COMMERCIAL]: {
    surfacePerUnitM2: 80,
    unitChargeKg: 8,
    annualLeakRate: 0.07,
    averageGwp: 2100,
  },
  [ColdType.MIXED]: {
    surfacePerUnitM2: 60,
    unitChargeKg: 5,
    annualLeakRate: 0.06,
    averageGwp: 2100,
  },
  [ColdType.INDUSTRIAL]: {
    surfacePerUnitM2: 100,
    unitChargeKg: 15,
    annualLeakRate: 0.08,
    averageGwp: 2100,
  },
};

/** Intensity level (cold) — form values */
export type IntensityLevel = 'Faible' | 'Modérée' | 'Élevée';
export const INTENSITY_COEFFICIENTS: Record<IntensityLevel, number> = {
  Faible: 0.8,
  Modérée: 1.0,
  Élevée: 1.2,
};

/** Equipment age — form values */
export type EquipmentAge = '<3 ans' | '3-7 ans' | '>7 ans' | 'NSP';
export const AGE_COEFFICIENTS: Record<EquipmentAge, number> = {
  '<3 ans': 0.9,
  '3-7 ans': 1.0,
  '>7 ans': 1.15,
  NSP: 1.0,
};

/** Maintenance status — form values */
export type MaintenanceStatus = 'Oui' | 'Non' | 'NSP';
export const MAINTENANCE_COEFFICIENTS: Record<MaintenanceStatus, number> = {
  Oui: 0.9,
  Non: 1.2,
  NSP: 1.0,
};

// ─── IT equipment (Scope 3) ─────────────────────────────────────────────────
export enum ITEquipmentType {
  LAPTOP = 'LAPTOP',
  DESKTOP = 'DESKTOP',
  SCREEN = 'SCREEN',
  PRO_PHONE = 'PRO_PHONE',
}

/** kgCO2e per unit per year */
export const IT_EQUIPMENT_EMISSIONS: Record<ITEquipmentType, number> = {
  [ITEquipmentType.LAPTOP]: 120,
  [ITEquipmentType.DESKTOP]: 200,
  [ITEquipmentType.SCREEN]: 80,
  [ITEquipmentType.PRO_PHONE]: 50,
};

// ─── Professional travel (Scope 3) ──────────────────────────────────────────
export enum TravelMode {
  PLANE = 'PLANE',
  TRAIN = 'TRAIN',
}

export type TravelFrequency = 'Rare' | 'Moyenne' | 'Fréquente';

/** kgCO2e per year by mode and frequency */
export const PROFESSIONAL_TRAVEL_EMISSIONS: Record<
  TravelMode,
  Record<TravelFrequency, number>
> = {
  [TravelMode.PLANE]: {
    Rare: 500,
    Moyenne: 1500,
    Fréquente: 4000,
  },
  [TravelMode.TRAIN]: {
    Rare: 50,
    Moyenne: 150,
    Fréquente: 400,
  },
};

// ─── Vehicles (Scope 1) ─────────────────────────────────────────────────────
export type VehicleUsageType =
  | 'Déplacements légers'
  | 'Livraisons / tournées'
  | 'Transport intensif / lourd';

/** Liters per 100 km by usage type */
export const VEHICLE_CONSUMPTION_BY_USAGE: Record<VehicleUsageType, number> = {
  'Déplacements légers': 6,
  'Livraisons / tournées': 9,
  'Transport intensif / lourd': 12,
};

export type FuelType = 'Diesel' | 'Essence' | 'MIXTE';

/** kgCO2e per liter of fuel */
export const FUEL_EMISSION_FACTORS: Record<FuelType, number> = {
  Diesel: 2.67,
  Essence: 2.28,
  MIXTE: 2.5,
};
