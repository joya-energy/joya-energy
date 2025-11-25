import {
  InsulationQualities,
  GlazingTypes,
  VentilationSystems,
  Floors
} from '@shared/enums/audit-batiment.enum';
import {
  INSULATION_FACTORS,
  GLAZING_FACTORS,
  VENTILATION_FACTORS,
  COMPACTNESS_FACTORS,
  FOUR_OR_MORE_FLOORS_THRESHOLD,
  TWO_OR_THREE_FLOORS_THRESHOLD
} from '../config';

/**
 * Calculates the building envelope factor based on insulation, glazing, and ventilation
 * F_enveloppe = F_isolation × F_vitrage × F_VMC
 */
export function computeEnvelopeFactor(
  insulation: InsulationQualities,
  glazing: GlazingTypes,
  ventilation: VentilationSystems
): number {
  const insulationFactor = INSULATION_FACTORS[insulation];
  const glazingFactor = GLAZING_FACTORS[glazing];
  const ventilationFactor = VENTILATION_FACTORS[ventilation];

  return insulationFactor * glazingFactor * ventilationFactor;
}

/**
 * Calculates the compactness factor based on number of floors
 * More floors = better compactness = lower factor
 */
export function computeCompactnessFactor(floors: number): number {
  if (floors >= FOUR_OR_MORE_FLOORS_THRESHOLD) {
    return COMPACTNESS_FACTORS[Floors.FOUR_OR_MORE];
  }

  if (floors >= TWO_OR_THREE_FLOORS_THRESHOLD) {
    return COMPACTNESS_FACTORS[Floors.TWO_OR_THREE];
  }

  return COMPACTNESS_FACTORS[Floors.SINGLE];
}


