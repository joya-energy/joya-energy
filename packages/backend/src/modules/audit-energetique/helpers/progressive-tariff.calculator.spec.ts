import { computeFlatRateTariff, convertAmountToConsumptionFlatRate } from './progressive-tariff.calculator';

describe('Flat Rate Tariff Calculator', () => {
  it('returns zero cost for zero consumption', () => {
    const result = computeFlatRateTariff({ monthlyConsumption: 0 });

    expect(result.monthlyCost).toBe(0);
    expect(result.annualCost).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.bracketDetails).toHaveLength(0);
  });

  it('applies the 0.195 rate for low consumption', () => {
    const result = computeFlatRateTariff({ monthlyConsumption: 150 });

    expect(result.monthlyCost).toBeCloseTo(29.25, 3);
    expect(result.annualCost).toBeCloseTo(351, 2);
    expect(result.effectiveRate).toBe(0.195);
    expect(result.bracketDetails[0].rate).toBe(0.195);
  });

  it('applies the 0.333 rate when consumption sits between 300 and 500', () => {
    const result = computeFlatRateTariff({ monthlyConsumption: 400 });

    expect(result.monthlyCost).toBeCloseTo(133.2, 3);
    expect(result.effectiveRate).toBe(0.333);
    expect(result.annualCost).toBeCloseTo(1598.4, 2);
    expect(result.bracketDetails[0].rate).toBe(0.333);
  });

  it('uses the top rate once consumption exceeds 500', () => {
    const result = computeFlatRateTariff({ monthlyConsumption: 600 });

    expect(result.monthlyCost).toBeCloseTo(234.6, 3);
    expect(result.annualCost).toBeCloseTo(2815.2, 2);
    expect(result.effectiveRate).toBe(0.391);
    expect(result.bracketDetails[0].rate).toBe(0.391);
  });
});

describe('convertAmountToConsumptionFlatRate', () => {
  it('uses a single bracket rate (flat-rate) to convert amount to kWh', () => {
    const result = convertAmountToConsumptionFlatRate({ monthlyAmount: 2144.244 });

    // 2144.244 DT/month corresponds to the 500+ bracket (0.391 DT/kWh)
    // consumption = amount / rate ≈ 5484.0 kWh/month
    expect(result.appliedRate).toBe(0.391);
    expect(result.monthlyConsumption).toBeCloseTo(2144.244 / 0.391, 2);
  });
});

