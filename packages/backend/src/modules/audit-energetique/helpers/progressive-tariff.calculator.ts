/**
 * Progressive Tariff Calculator (simplified)
 * Rates follow the STEG Non-résidentiel BT table but apply a single rate
 * based on the monthly consumption bracket instead of a cumulative structure.
 */

export interface ProgressiveTariffInput {
  monthlyConsumption: number; // kWh/month
}

export interface BracketDetail {
  min: number;
  max: number;
  rate: number;
}

export interface ProgressiveTariffResult {
  monthlyCost: number; // DT/month
  annualCost: number; // DT/year
  effectiveRate: number; // DT/kWh
  bracketDetails: BracketDetail[];
}

const TARIFF_TABLE: BracketDetail[] = [
  { min: 0, max: 200, rate: 0.195 },
  { min: 200, max: 300, rate: 0.240 },
  { min: 300, max: 500, rate: 0.333 },
  { min: 500, max: Number.POSITIVE_INFINITY, rate: 0.391 }
];

const resolveRate = (consumption: number): BracketDetail => {
  return (
    TARIFF_TABLE.find((bracket) => consumption <= bracket.max) ??
    TARIFF_TABLE[TARIFF_TABLE.length - 1]
  );
};

export function computeProgressiveTariff(
  input: ProgressiveTariffInput
): ProgressiveTariffResult {
  const { monthlyConsumption } = input;

  if (monthlyConsumption <= 0) {
    return {
      monthlyCost: 0,
      annualCost: 0,
      effectiveRate: 0,
      bracketDetails: []
    };
  }

  const bracket = resolveRate(monthlyConsumption);
  const monthlyCost = monthlyConsumption * bracket.rate;
  const annualCost = monthlyCost * 12;

  return {
    monthlyCost: Number(monthlyCost.toFixed(3)),
    annualCost: Number(annualCost.toFixed(2)),
    effectiveRate: Number(bracket.rate.toFixed(3)),
    bracketDetails: [bracket]
  };
}

