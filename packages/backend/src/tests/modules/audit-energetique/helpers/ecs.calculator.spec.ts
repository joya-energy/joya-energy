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

    expect(result.perSquare).toBeCloseTo(88.888, 3);
  });

  it('handles solar appoint part only', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.SOLAR
    });

    expect(result.perSquare).toBeCloseTo(26.666, 3);
  });

  it('handles heat pump performance', () => {
    const result = computeDomesticHotWaterLoad({
      ...baseInput,
      ecsType: DomesticHotWaterTypes.HEAT_PUMP
    });

    expect(result.perSquare).toBeCloseTo(26.666, 3);
  });
});


