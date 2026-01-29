import { computeCo2Emissions } from '../../../modules/audit-energetique/helpers/emissions.calculator';

describe('computeCo2Emissions', () => {
  it('uses default emission factors', () => {
    const result = computeCo2Emissions({
      electricityConsumption: 10000,
      gasConsumption: 5000
    });

    expect(result.co2FromElectricity).toBeCloseTo(5120);
    expect(result.co2FromGas).toBeCloseTo(1010);
    expect(result.totalCo2Tons).toBeCloseTo(6.13);
  });

  it('accepts custom emission factors', () => {
    const result = computeCo2Emissions({
      electricityConsumption: 1000,
      gasConsumption: 1000,
      emissionFactorElec: 0.4,
      emissionFactorGas: 0.3
    });

    expect(result.totalCo2).toBe(700);
  });
});

