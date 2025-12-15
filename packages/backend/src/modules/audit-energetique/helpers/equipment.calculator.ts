import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { EquipmentCategories } from '@shared/enums/audit-usage.enum';
import { EQUIPMENT_LOADS } from '../config';

export interface EquipmentCalculationInput {
  buildingType: BuildingTypes;
  categories: EquipmentCategories[];
  usageFactor: number;
  processFactor: number;
  surface: number;
}

export interface EquipmentCalculationResult {
  perSquare: number;
  absoluteKwh: number;
}

/**
 * Calculates equipment loads based on selected categories
 * Some equipment runs 24/7 (industrial cold), others follow usage patterns
 * 
 * Special case: Pharmacies have mandatory refrigeration based on surface area
 */
export function computeEquipmentLoads(params: EquipmentCalculationInput): EquipmentCalculationResult {
  const { categories, usageFactor, processFactor } = params;

  let perSquare = 0;
  let absoluteKwh = 0;

  for (const category of categories) {
    const load = EQUIPMENT_LOADS[category];
    if (!load) {
      continue;
    }

    if (load.is24h) {
      perSquare += load.value;
    } else {
      perSquare += load.value * usageFactor * processFactor;
    }
  }

 /* if (buildingType === BuildingTypes.PHARMACY) {
    const coldLoad = computePharmacyColdLoad(surface);
    if (coldLoad > 0 && surface > 0) {
      perSquare += coldLoad;
    }
  } */

  return { perSquare, absoluteKwh };
}

/**
 * Computes mandatory refrigeration load for pharmacies
 * Based on surface area thresholds
 */
/*
export function computePharmacyColdLoad(surface: number): number {
  for (const threshold of PHARMACY_COLD_THRESHOLDS) {
    if (surface <= threshold.maxSurface) {
      return threshold.energy;
    }
  }

  return PHARMACY_COLD_THRESHOLDS[PHARMACY_COLD_THRESHOLDS.length - 1]?.energy ?? 0;
}
*/

