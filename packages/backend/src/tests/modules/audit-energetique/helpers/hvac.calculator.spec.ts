import {
  ConditionedCoverage,
  HeatingSystemTypes,
  CoolingSystemTypes
} from '@shared/enums/audit-batiment.enum';
import { computeHvacLoads } from '../../../modules/audit-energetique/helpers/hvac.calculator';

const baseClimate = {
  heatingFactor: 1,
  coolingFactor: 1,
  winterWeight: 0.3,
  summerWeight: 0.5,
  midSeasonWeight: 0.2
};

describe('computeHvacLoads', () => {
  it('computes heating and cooling loads with coverage applied', () => {
    const result = computeHvacLoads({
      hvacBase: 100,
      climate: baseClimate,
      usageFactor: 0.5,
      heatingSystem: HeatingSystemTypes.ELECTRIC_INDIVIDUAL,
      coolingSystem: CoolingSystemTypes.SPLIT,
      conditionedCoverage: ConditionedCoverage.MOST_BUILDING,
      heatingK: 0.2,
      coolingK: 0.3
    });

    expect(result.heatingLoad).toBeCloseTo(24);
    expect(result.coolingLoad).toBeCloseTo(39);
    expect(result.perSquare).toBeCloseTo(63);
  });

  it('applies coverage factor to combined load', () => {
    const result = computeHvacLoads({
      hvacBase: 100,
      climate: baseClimate,
      usageFactor: 0.5,
      heatingSystem: HeatingSystemTypes.ELECTRIC_INDIVIDUAL,
      coolingSystem: CoolingSystemTypes.SPLIT,
      conditionedCoverage: ConditionedCoverage.HALF_BUILDING,
      heatingK: 0.2,
      coolingK: 0.3
    });

    expect(result.perSquare).toBeCloseTo(63 * 0.6);
  });

  it('returns zero loads when HVAC systems are absent', () => {
    const result = computeHvacLoads({
      hvacBase: 100,
      climate: baseClimate,
      usageFactor: 0.8,
      heatingSystem: HeatingSystemTypes.NONE,
      coolingSystem: CoolingSystemTypes.NONE,
      conditionedCoverage: ConditionedCoverage.FEW_ROOMS,
      heatingK: 0.2,
      coolingK: 0.3
    });

    expect(result.heatingLoad).toBe(0);
    expect(result.coolingLoad).toBe(0);
    expect(result.perSquare).toBe(0);
  });
});


