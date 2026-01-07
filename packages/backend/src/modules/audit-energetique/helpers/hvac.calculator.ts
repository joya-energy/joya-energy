import { HeatingSystemTypes, CoolingSystemTypes, ConditionedCoverage } from '@shared/enums/audit-batiment.enum';
import { COOLING_COVERAGE_FACTORS } from '../config';
import { type ClimateWeights } from '../config/climate-factors.config';

export interface HvacCalculationInput {
  hvacBase: number;
  climate: ClimateWeights;
  usageFactor: number;
  heatingSystem: HeatingSystemTypes;
  coolingSystem: CoolingSystemTypes;
  conditionedCoverage: ConditionedCoverage;
  heatingK: number;
  coolingK: number;
}

export interface HvacCalculationResult {
  perSquare: number;
  heatingLoad: number;
  coolingLoad: number;
}
const GAS_BOILER_EFFICIENCY = 0.7;
const ELECTRIC_HEATING_EFFICIENCY = 0.92;

/**
 * Calculates HVAC loads (heating + cooling) per square meter
 * Takes into account climate, usage patterns, and system types
 * 
 * Formulas:
 * - F*_ch = k_ch + (1 - k_ch) × F_usage
 * - F*_fr = k_fr + (1 - k_fr) × F_usage
 * - C_ch = Base_HVAC × (w_hiver×F_ch×F*_ch + 0.5×w_mi×F_ch×F*_ch) / 0.6
 * - C_fr = Base_HVAC × (w_été×F_fr×F*_fr + 0.5×w_mi×F_fr×F*_fr)
 */
export function computeHvacLoads(params: HvacCalculationInput): HvacCalculationResult {
  const {
    hvacBase,
    climate,
    usageFactor,
    heatingSystem,
    coolingSystem,
    conditionedCoverage,
    heatingK,
    coolingK
  } = params;

  const effectiveHeatingUsage = heatingK + (1 - heatingK) * usageFactor;
  const effectiveCoolingUsage = coolingK + (1 - coolingK) * usageFactor;

  let heatingLoad = 0;
  let coolingLoad = 0;

  if (heatingSystem !== HeatingSystemTypes.NONE) {
    if (heatingSystem === HeatingSystemTypes.GAS_BOILER) {
      heatingLoad =
        (hvacBase *
          (climate.winterWeight * climate.heatingFactor * effectiveHeatingUsage +
            0.5 * climate.midSeasonWeight * climate.heatingFactor * effectiveHeatingUsage)) /
        GAS_BOILER_EFFICIENCY;
    }
    else if (heatingSystem === HeatingSystemTypes.ELECTRIC_HEATING) {
      heatingLoad =
        (hvacBase *
          (climate.winterWeight * climate.heatingFactor * effectiveHeatingUsage +
            0.5 * climate.midSeasonWeight * climate.heatingFactor * effectiveHeatingUsage)) /
        ELECTRIC_HEATING_EFFICIENCY;
    }
    else {
      heatingLoad =
        hvacBase *
        (climate.winterWeight * climate.heatingFactor * effectiveHeatingUsage +
          0.5 * climate.midSeasonWeight * climate.heatingFactor * effectiveHeatingUsage);
    }
  }

  if (coolingSystem !== CoolingSystemTypes.NONE) {
    coolingLoad =
      hvacBase *
      (climate.summerWeight * climate.coolingFactor * effectiveCoolingUsage +
        0.5 * climate.midSeasonWeight * climate.coolingFactor * effectiveCoolingUsage);
  }

  const coverageFactor = COOLING_COVERAGE_FACTORS[conditionedCoverage] ?? 1;
  const totalLoad = (heatingLoad + coolingLoad) * coverageFactor;

  return {
    perSquare: totalLoad,
    heatingLoad,
    coolingLoad
  };
}


