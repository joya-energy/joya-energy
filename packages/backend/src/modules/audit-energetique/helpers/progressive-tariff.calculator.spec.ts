import { computeProgressiveTariff } from './progressive-tariff.calculator';

describe('Progressive Tariff Calculator', () => {
  it('returns zero cost for zero consumption', () => {
    const result = computeProgressiveTariff({ monthlyConsumption: 0 });

    expect(result.monthlyCost).toBe(0);
    expect(result.annualCost).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.bracketDetails).toHaveLength(0);
  });

  it('applies the 0.195 rate for low consumption', () => {
    const result = computeProgressiveTariff({ monthlyConsumption: 150 });

    expect(result.monthlyCost).toBeCloseTo(29.25, 3);
    expect(result.annualCost).toBeCloseTo(351, 2);
    expect(result.effectiveRate).toBe(0.195);
    expect(result.bracketDetails[0].rate).toBe(0.195);
  });

  it('applies the 0.333 rate when consumption sits between 300 and 500', () => {
    const result = computeProgressiveTariff({ monthlyConsumption: 400 });

    expect(result.monthlyCost).toBeCloseTo(133.2, 3);
    expect(result.effectiveRate).toBe(0.333);
    expect(result.annualCost).toBeCloseTo(1598.4, 2);
    expect(result.bracketDetails[0].rate).toBe(0.333);
  });

  it('uses the top rate once consumption exceeds 500', () => {
    const result = computeProgressiveTariff({ monthlyConsumption: 600 });

    expect(result.monthlyCost).toBeCloseTo(234.6, 3);
    expect(result.annualCost).toBeCloseTo(2815.2, 2);
    expect(result.effectiveRate).toBe(0.391);
    expect(result.bracketDetails[0].rate).toBe(0.391);
  });
});

