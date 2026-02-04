/**
 * Progressive Tariff Calculator (simplified)
 * Rates follow the STEG Non-résidentiel BT table but apply a single rate
 * based on the monthly consumption bracket instead of a cumulative structure.
 */

export interface ProgressiveTariffInput {
  monthlyConsumption: number; // kWh/month
}

export interface AmountToConsumptionInput {
  monthlyAmount: number; // DT/month
}

export interface AmountToConsumptionResult {
  monthlyConsumption: number; // kWh/month
  monthlyAmount: number; // DT/month (input)
  effectiveRate: number; // DT/kWh
  bracketDetails: BracketDetail[];
}

export interface AmountToConsumptionFlatRateResult {
  monthlyConsumption: number; // kWh/month
  monthlyAmount: number; // DT/month (input)
  appliedRate: number; // DT/kWh (single rate applied to entire consumption)
  bracket: BracketDetail;
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

export interface FlatRateTariffResult {
  monthlyCost: number; // DT/month
  annualCost: number; // DT/year
  effectiveRate: number; // DT/kWh (single rate applied to all monthly kWh)
  bracketDetails: BracketDetail[]; // single selected bracket
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

export function convertAmountToConsumption(
  input: AmountToConsumptionInput
): AmountToConsumptionResult {
  const { monthlyAmount } = input;

  if (monthlyAmount <= 0) {
    return {
      monthlyConsumption: 0,
      monthlyAmount: 0,
      effectiveRate: 0,
      bracketDetails: []
    };
  }

  let remainingAmount = monthlyAmount;
  let totalConsumption = 0;
  let effectiveRate = 0;
  const bracketDetails: BracketDetail[] = [];

  for (let i = 0; i < TARIFF_TABLE.length; i++) {
    const bracket = TARIFF_TABLE[i];
    const isLastBracket = i === TARIFF_TABLE.length - 1;
    const isFirstBracket = i === 0;

    if (isFirstBracket) {
      // First bracket: 0 to 200 kWh
      const maxAmountForBracket = bracket.max * bracket.rate;
      if (remainingAmount <= maxAmountForBracket) {
        // Amount fits within this bracket
        const consumption = remainingAmount / bracket.rate;
        totalConsumption += consumption;
        effectiveRate = bracket.rate;
        bracketDetails.push(bracket);
        break;
      } else {
        // Amount exceeds this bracket, take all of this bracket
        totalConsumption += bracket.max;
        remainingAmount -= maxAmountForBracket;
        bracketDetails.push(bracket);
      }
    } else if (!isLastBracket) {
      // Middle brackets
      const bracketRange = bracket.max - bracket.min;
      const maxAmountForBracket = bracketRange * bracket.rate;

      if (remainingAmount <= maxAmountForBracket) {
        // Amount fits within this bracket
        const consumption = remainingAmount / bracket.rate;
        totalConsumption += consumption;
        effectiveRate = bracket.rate;
        bracketDetails.push(bracket);
        break;
      } else {
        // Amount exceeds this bracket, take all of this bracket
        totalConsumption += bracketRange;
        remainingAmount -= maxAmountForBracket;
        bracketDetails.push(bracket);
      }
    } else {
      // Last bracket (unlimited)
      const consumption = remainingAmount / bracket.rate;
      totalConsumption += consumption;
      effectiveRate = bracket.rate;
      bracketDetails.push(bracket);
    }
  }

  // Calculate effective rate as total amount / total consumption
  effectiveRate = monthlyAmount / totalConsumption;

  return {
    monthlyConsumption: Number(totalConsumption.toFixed(2)),
    monthlyAmount: monthlyAmount,
    effectiveRate: Number(effectiveRate.toFixed(4)),
    bracketDetails
  };
}

/**
 * Convert monthly bill amount (DT) into monthly consumption (kWh) using a flat-rate model:
 * pick the single tariff bracket rate and apply it to ALL kWh for the month.
 *
 * This is the inverse of: amount = consumption × rate(consumption)
 *
 * Strategy:
 * - For each bracket rate r:
 *   - estimate consumption = amount / r
 *   - if estimated consumption falls within that bracket, that's the solution
 */
export function convertAmountToConsumptionFlatRate(
  input: AmountToConsumptionInput
): AmountToConsumptionFlatRateResult {
  const { monthlyAmount } = input;

  if (monthlyAmount <= 0) {
    return {
      monthlyConsumption: 0,
      monthlyAmount: 0,
      appliedRate: 0,
      bracket: { min: 0, max: 0, rate: 0 },
    };
  }

  for (const bracket of TARIFF_TABLE) {
    const estimatedConsumption = monthlyAmount / bracket.rate;
    const isInBracket =
      estimatedConsumption > bracket.min && estimatedConsumption <= bracket.max;

    if (isInBracket) {
      return {
        monthlyConsumption: Number(estimatedConsumption.toFixed(2)),
        monthlyAmount,
        appliedRate: bracket.rate,
        bracket,
      };
    }
  }

  const lastBracket = TARIFF_TABLE[TARIFF_TABLE.length - 1];
  const estimatedConsumption = monthlyAmount / lastBracket.rate;
  return {
    monthlyConsumption: Number(estimatedConsumption.toFixed(2)),
    monthlyAmount,
    appliedRate: lastBracket.rate,
    bracket: lastBracket,
  };
}

export function computeProgressiveTariff(
  input: ProgressiveTariffInput
): ProgressiveTariffResult {
  // Backward-compatible alias: this module actually computes a flat-rate tariff.
  return computeFlatRateTariff(input);
}

/**
 * Flat-rate tariff calculator:
 * Selects a single bracket by monthly consumption and bills ALL kWh at that bracket's rate.
 */
export function computeFlatRateTariff(
  input: ProgressiveTariffInput
): FlatRateTariffResult {
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

