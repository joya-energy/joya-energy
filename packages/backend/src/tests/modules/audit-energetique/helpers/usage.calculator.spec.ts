import { computeUsageFactor } from '../../../modules/audit-energetique/helpers/usage.calculator';

describe('computeUsageFactor', () => {
  it('calculates annualized usage factor', () => {
    const result = computeUsageFactor(10, 6);

    expect(result).toBeCloseTo((10 * 6 * 52) / 8760);
  });

  it('caps the factor at 1 when schedule exceeds annual hours', () => {
    expect(computeUsageFactor(24, 7)).toBe(1);
  });

  it('never returns negative usage', () => {
    expect(computeUsageFactor(-5, 5)).toBe(0);
  });
});


