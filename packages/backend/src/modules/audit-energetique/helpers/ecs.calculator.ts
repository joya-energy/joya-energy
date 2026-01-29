import { DomesticHotWaterTypes } from '@shared/enums/audit-batiment.enum';

export interface EcsCalculationInput {
  ecsType: DomesticHotWaterTypes;
  ecsUsageFactor: number;
  reference: number;
  gasEfficiency: number;
  solarCoverage: number;
  solarAppointEff: number;
  heatPumpCop: number;
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
 * - Electric: η = 1.0 (100% conversion)
 * - Gas: η ≈ 0.92 (combustion losses)
 * - Solar: 70% solar + 30% appoint
 * - Heat Pump: COP ≈ 3.0 (3x more efficient)
 */
export function computeDomesticHotWaterLoad(params: EcsCalculationInput): EcsCalculationResult {
  const {
    ecsType,
    ecsUsageFactor,
    reference,
    gasEfficiency,
    solarCoverage,
    solarAppointEff,
    heatPumpCop
  } = params;

  const ecsUtile = reference * ecsUsageFactor;

  if (ecsType === DomesticHotWaterTypes.NONE) {
    return { perSquare: 0, absoluteKwh: 0 };
  }

  switch (ecsType) {
    case DomesticHotWaterTypes.ELECTRIC:
      return { perSquare: ecsUtile, absoluteKwh: 0 };

    case DomesticHotWaterTypes.GAS:
      return { perSquare: ecsUtile / gasEfficiency, absoluteKwh: 0 };

    case DomesticHotWaterTypes.SOLAR: {
      const appointPart = (1 - solarCoverage) * (ecsUtile / solarAppointEff);
      return { perSquare: appointPart, absoluteKwh: 0 };
    }

    case DomesticHotWaterTypes.HEAT_PUMP:
      return { perSquare: ecsUtile / heatPumpCop, absoluteKwh: 0 };

    default:
      return { perSquare: ecsUtile, absoluteKwh: 0 };
  }
}

