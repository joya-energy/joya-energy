import { DomesticHotWaterTypes } from '@shared/enums/audit-batiment.enum';

export interface EcsCalculationInput {
  ecsType: DomesticHotWaterTypes;
  ecsUsageFactor: number;
  reference: number;
  gasEfficiency: number;
  electricEfficiency: number;
}

export interface EcsCalculationResult {
  perSquare: number;
  absoluteKwh: number;
}

/**
 * Calculates Domestic Hot Water (ECS) energy consumption
 * Takes into account system type and efficiency
 * 
 * System types:
 * - Electric: η = 0.92 (92% conversion)
 * - Gas: η ≈ 0.7 (70% conversion)
 * - Solar: n=1
 * - Heat Pump: n=1
 */
export function computeDomesticHotWaterLoad(params: EcsCalculationInput): EcsCalculationResult {
  const {
    ecsType,
    ecsUsageFactor,
    reference,
    gasEfficiency,
    electricEfficiency,
  } = params;

  const ecsUtile = reference * ecsUsageFactor;

  if (ecsType === DomesticHotWaterTypes.NONE) {
    return { perSquare: 0, absoluteKwh: 0 };
  }

  switch (ecsType) {
    case DomesticHotWaterTypes.ELECTRIC:
      return { perSquare: ecsUtile / electricEfficiency, absoluteKwh: 0 };

    case DomesticHotWaterTypes.GAS:
      return { perSquare: ecsUtile / gasEfficiency, absoluteKwh: 0 };

    case DomesticHotWaterTypes.SOLAR: {
      return { perSquare: ecsUtile, absoluteKwh: 0 };
    }

    case DomesticHotWaterTypes.HEAT_PUMP:
      return { perSquare: ecsUtile , absoluteKwh: 0 };

    default:
      return { perSquare: ecsUtile, absoluteKwh: 0 };
  }
}

