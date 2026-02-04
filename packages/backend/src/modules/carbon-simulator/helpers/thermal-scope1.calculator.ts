/**
 * Thermal Scope 1 Calculator (CO2_th)
 *
 * Implements the manual step-by-step formulas provided by JOYA:
 * - Étape 0 — Activation
 * - Étape 1 — Chaleur de base (kWh_th_base)
 * - Étape 2 — Coefficient d’usages C_usages
 * - Étape 3 — Chaleur finale estimée (kWh_th)
 * - Étape 5 — Choix du FE_th
 * - Étape 6 — CO₂ thermique (Scope 1)
 */

import {
  THERMAL_RATIO_BY_SECTOR,
  HEAT_USAGE_COEFFICIENTS,
  CARBON_EMISSION_FACTORS,
} from '@backend/domain/carbon';
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { Logger } from '@backend/middlewares';

/**
 * Heat usages (checkboxes in the form)
 */
export type HeatUsageKey = keyof typeof HEAT_USAGE_COEFFICIENTS;

/**
 * Heat energy types selected in the form
 */
export type HeatEnergyType = 'NATURAL_GAS' | 'DIESEL_FUEL' | 'LPG' | 'UNKNOWN';

/**
 * Input for thermal Scope 1 calculation (CO2_th)
 */
export interface ThermalScope1Input {
  /**
   * Are there any heat usages on site?
   * (Des usages de chaleur sont-ils présents sur le site ?)
   */
  hasHeatUsages: boolean;

  /**
   * Annual electricity consumption (kWh_an) from extrapolation
   * This is the same E_annuel estimé used in the electricity CO₂ step.
   */
  annualElectricityKwh: number;

  /**
   * Sector / building type (to select r_th)
   */
  buildingType: BuildingTypes;

  /**
   * Selected heat usages (ECS, cuisson, process, chauffage…)
   */
  selectedHeatUsages: HeatUsageKey[];

  /**
   * Selected heat energies (gaz, diesel, GPL, je ne sais pas…)
   */
  selectedHeatEnergies: HeatEnergyType[];
}

/**
 * Result of thermal Scope 1 calculation
 */
export interface ThermalScope1Result {
  /**
   * kWh_th_base (before usage coefficient)
   */
  baseThermalKwh: number;

  /**
   * C_usages (coefficient d’usages, after clamp)
   */
  usagesCoefficient: number;

  /**
   * Final estimated thermal energy (kWh_th)
   */
  finalThermalKwh: number;

  /**
   * Applied thermal emission factor FE_th (kgCO2e/kWh)
   */
  appliedThermalEmissionFactor: number;

  /**
   * CO₂ thermique (kgCO2e/an)
   */
  co2ThermalKg: number;

  /**
   * CO₂ thermique (tCO2e/an)
   */
  co2ThermalTonnes: number;
}

/**
 * Helper: get r_th for a given building type
 * Throws if building type is unknown (no default).
 */
function getThermalRatio(buildingType: BuildingTypes): number {
  const key = buildingType as unknown as keyof typeof THERMAL_RATIO_BY_SECTOR;
  const value = THERMAL_RATIO_BY_SECTOR[key];
  if (value === undefined) {
    throw new Error(`Unknown building type for thermal ratio: buildingType=${buildingType}`);
  }
  return value;
}

/**
 * Helper: compute C_usages from selected usages with clamp [0.8, 1.6]
 *
 * W = sum(w)
 * C_usages = 0.6 + W, then clamp
 */
function computeUsagesCoefficient(selectedHeatUsages: HeatUsageKey[]): number {
  if (selectedHeatUsages.length === 0) {
    // If no usage specified but heat is present, keep neutral-ish coefficient
    return 1.0;
  }

  const W = selectedHeatUsages.reduce((sum, usage) => {
    return sum + HEAT_USAGE_COEFFICIENTS[usage];
  }, 0);

  let C_usages = 0.6 + W;

  if (C_usages < 0.8) C_usages = 0.8;
  if (C_usages > 1.6) C_usages = 1.6;

  return Number(C_usages.toFixed(3));
}

/**
 * Helper: choose FE_th (thermal emission factor) based on selected energies
 *
 * Rules:
 * - If only NATURAL_GAS → FE_th = FE_GN
 * - If only LPG → FE_th = FE_GPL
 * - If only DIESEL_FUEL → FE_th = FE_TH_MIX  (no litres, so use mix proxy)
 * - If multiple energies OR UNKNOWN → FE_th = FE_TH_MIX
 */
function chooseThermalEmissionFactor(selectedHeatEnergies: HeatEnergyType[]): number {
  if (selectedHeatEnergies.length === 0) {
    // Unknown energy → use mix
    return CARBON_EMISSION_FACTORS.THERMAL_MIX;
  }

  const unique = Array.from(new Set(selectedHeatEnergies));

  if (unique.length === 1) {
    const energy = unique[0];
    switch (energy) {
      case 'NATURAL_GAS':
        return CARBON_EMISSION_FACTORS.NATURAL_GAS;
      case 'LPG':
        return CARBON_EMISSION_FACTORS.LPG;
      case 'DIESEL_FUEL':
        return CARBON_EMISSION_FACTORS.THERMAL_MIX;
      case 'UNKNOWN':
      default:
        return CARBON_EMISSION_FACTORS.THERMAL_MIX;
    }
  }

  // Multiple energies → mix
  return CARBON_EMISSION_FACTORS.THERMAL_MIX;
}

/**
 * Main function: calculate CO₂ thermique (Scope 1)
 *
 * Implements:
 * - Étape 0 — Activation
 * - Étape 1 — kWh_th_base = E_annuel_estimé × r_th
 * - Étape 2 — C_usages = clamp(0.6 + Σw, [0.8, 1.6])
 * - Étape 3 — kWh_th = kWh_th_base × C_usages
 * - Étape 5 — FE_th (gaz / GPL / mix)
 * - Étape 6 — CO2_th = kWh_th × FE_th ; tCO2_th = CO2_th / 1000
 */
export function calculateThermalScope1(input: ThermalScope1Input): ThermalScope1Result {
  // Étape 0 — Activation
  if (!input.hasHeatUsages) {
    Logger.info('CO2_th = 0 (no heat usages)');
    return {
      baseThermalKwh: 0,
      usagesCoefficient: 0,
      finalThermalKwh: 0,
      appliedThermalEmissionFactor: 0,
      co2ThermalKg: 0,
      co2ThermalTonnes: 0,
    };
  }

  // Étape 1 — Chaleur de base
  const r_th = getThermalRatio(input.buildingType);
  const baseThermalKwh = Number((input.annualElectricityKwh * r_th).toFixed(2));

  // Étape 2 — Coefficient d’usages
  const usagesCoefficient = computeUsagesCoefficient(input.selectedHeatUsages);

  // Étape 3 — Chaleur finale estimée
  const finalThermalKwh = Number((baseThermalKwh * usagesCoefficient).toFixed(2));

  // Étape 5 — Choisir FE_th
  const appliedThermalEmissionFactor = chooseThermalEmissionFactor(input.selectedHeatEnergies);

  // Étape 6 — CO₂ thermique
  const co2ThermalKg = Number((finalThermalKwh * appliedThermalEmissionFactor).toFixed(2));
  const co2ThermalTonnes = Number((co2ThermalKg / 1000).toFixed(3));

  Logger.info(
    `CO2_th result: kWh_th_base=${baseThermalKwh}, C_usages=${usagesCoefficient}, ` +
      `kWh_th=${finalThermalKwh}, FE_th=${appliedThermalEmissionFactor}, ` +
      `CO2_th=${co2ThermalKg} kg (${co2ThermalTonnes} t)`,
  );

  return {
    baseThermalKwh,
    usagesCoefficient,
    finalThermalKwh,
    appliedThermalEmissionFactor,
    co2ThermalKg,
    co2ThermalTonnes,
  };
}

