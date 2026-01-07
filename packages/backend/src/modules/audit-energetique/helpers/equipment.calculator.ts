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
 */
export function computeEquipmentLoads(params: EquipmentCalculationInput): EquipmentCalculationResult {
  const { categories, usageFactor, processFactor } = params;

  let perSquare = 0;

  for (const category of categories) {
    const load = EQUIPMENT_LOADS[category];
    if (!load) continue;

    if (load.is24h) {
      perSquare += load.value;
    } else {
      perSquare += load.value * usageFactor * processFactor;
    }
  }

  return { perSquare, absoluteKwh: 0 };
}


