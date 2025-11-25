import { computeUsageFactor } from '../../../modules/audit-energetique/helpers/usage.calculator';

describe('computeUsageFactor', () => {
  it('calculates annualized usage factor', () => {
    const result = computeUsageFactor(10, 6);
    expect(result).toBeCloseTo((10 * 6 * 52) / 8760);
  });

  it('returns close to 1 for 24/7 operation', () => {
    const result = computeUsageFactor(24, 7);
    expect(result).toBeCloseTo(1);
  });

  it('caps the factor at 1 when schedule would exceed 1.0', () => {
    const result = computeUsageFactor(25, 7);
    expect(result).toBe(1);
  });

  it('never returns negative usage', () => {
    expect(computeUsageFactor(-5, 5)).toBe(0);
  });
});

