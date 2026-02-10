import { DomesticHotWaterTypes } from '@shared/enums/audit-batiment.enum';
import { computeDomesticHotWaterLoad } from '../../../modules/audit-energetique/helpers/ecs.calculator';

const baseInput = {
  ecsUsageFactor: 0.8,
  usageFactor: 1,
  reference: 100,
  gasEfficiency: 0.9,
  electricEfficiency: 1,
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

    // Gas: 80 / 0.9 = 88.888...
    expect(result.perSquare).toBeCloseTo(88.889, 2);
  });

  it('handles solar appoint part only', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.SOLAR
    });

    // Solar: ecsUtile = reference * ecsUsageFactor * usageFactor = 100 * 0.8 * 1 = 80
    expect(result.perSquare).toBeCloseTo(80, 2);
  });

  it('handles heat pump performance', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.HEAT_PUMP
    });

    // Heat pump: ecsUtile = 80
    expect(result.perSquare).toBeCloseTo(80, 2);
  });
});

