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

  if(heatingSystem === HeatingSystemTypes.GAS_BOILER) {
    heatingLoad = hvacBase * (
      climate.winterWeight * climate.heatingFactor * effectiveHeatingUsage +
      0.5 * climate.midSeasonWeight * climate.heatingFactor * effectiveHeatingUsage
    ) / 0.6;
  } else {
    heatingLoad = hvacBase * (
      climate.winterWeight * climate.heatingFactor * effectiveHeatingUsage +
      0.5 * climate.midSeasonWeight * climate.heatingFactor * effectiveHeatingUsage
    );
  }
/*  if (heatingSystem !== HeatingSystemTypes.NONE) {
    heatingLoad = hvacBase * (
      climate.winterWeight * climate.heatingFactor * effectiveHeatingUsage +
      0.5 * climate.midSeasonWeight * climate.heatingFactor * effectiveHeatingUsage
    ) / 0.6;
  }*/

  if (coolingSystem !== CoolingSystemTypes.NONE) {
    coolingLoad = hvacBase * (
      climate.summerWeight * climate.coolingFactor * effectiveCoolingUsage +
      0.5 * climate.midSeasonWeight * climate.coolingFactor * effectiveCoolingUsage
    );
  }

  const coverageFactor = COOLING_COVERAGE_FACTORS[conditionedCoverage] ?? 1;
  const totalLoad = (heatingLoad + coolingLoad) * coverageFactor;

  return {
    perSquare: totalLoad,
    heatingLoad,
    coolingLoad
  };
}


