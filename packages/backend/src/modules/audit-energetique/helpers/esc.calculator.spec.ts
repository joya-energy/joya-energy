import { DomesticHotWaterTypes } from '@shared/enums/audit-batiment.enum';
import { computeDomesticHotWaterLoad } from '../../../modules/audit-energetique/helpers/ecs.calculator';

const baseInput = {
  ecsUsageFactor: 0.8,
  reference: 100,
  gasEfficiency: 0.9,
  solarCoverage: 0.7,
  solarAppointEff: 0.9,
  heatPumpCop: 3
};

describe('computeDomesticHotWaterLoad', () => {
  it('returns zero load when ECS is not installed', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.NONE
    });

    expect(result).toEqual({ perSquare: 0, absoluteKwh: 0 });
  });

  it('handles electric systems', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.ELECTRIC
    });

    expect(result.perSquare).toBeCloseTo(80);
  });

  it('handles gas systems with efficiency losses', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.GAS
    });

    // Gas: 80 / 0.9 = 88.888... (repeating)
    expect(result.perSquare).toBeCloseTo(88.889, 2);
  });

  it('handles solar appoint part only', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.SOLAR
    });

    // Solar: (1 - 0.7) * (80 / 0.9) = 0.3 * 88.889 = 26.667 (repeating)
    expect(result.perSquare).toBeCloseTo(26.667, 2);
  });

  it('handles heat pump performance', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.HEAT_PUMP
    });

    // Heat pump: 80 / 3 = 26.666... (repeating)
    expect(result.perSquare).toBeCloseTo(26.667, 2);
  });
});

