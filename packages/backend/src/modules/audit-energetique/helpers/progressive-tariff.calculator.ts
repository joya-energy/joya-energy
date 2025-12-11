/**
 * Progressive Tariff Calculator
 * 
 * @description
 * Calculates electricity cost based on STEG's progressive tariff structure
 * for Non-résidentiel BT (Consommation > 100 kWh/mois)
 * 
 * Progressive pricing means different consumption brackets are charged at different rates,
 * similar to progressive taxation.
 * 
 * Example:
 * For 400 kWh monthly consumption:
 * - First 200 kWh × 0.195 = 39.00 DT
 * - Next 100 kWh × 0.240 = 24.00 DT
 * - Next 100 kWh × 0.333 = 33.30 DT
 * - Total = 96.30 DT
 */

export interface TariffBracket {
  min: number; // kWh (inclusive)
  max: number; // kWh (exclusive, use Infinity for open-ended)
  rate: number; // DT/kWh
}

export interface ProgressiveTariffInput {
  monthlyConsumption: number; // kWh/month
}

export interface ProgressiveTariffResult {
  monthlyCost: number; // DT/month
  annualCost: number; // DT/year
  effectiveRate: number; // DT/kWh (average rate paid)
  bracketDetails: BracketDetail[];
}

export interface BracketDetail {
  min: number;
  max: number;
  rate: number;
  consumption: number; // kWh consumed in this bracket
  cost: number; // DT cost for this bracket
}

/**
 * STEG Non-résidentiel BT Tariff Structure
 * Source: STEG official tariff table (> 100 kWh/month)
 */
const NON_RESIDENTIAL_BT_TARIFF: TariffBracket[] = [
  { min: 0, max: 200, rate: 0.195 },
  { min: 200, max: 300, rate: 0.240 },
  { min: 300, max: 500, rate: 0.333 },
  { min: 500, max: Number.POSITIVE_INFINITY, rate: 0.391 }
];

/**
 * Calculates the amount of consumption within a specific bracket
 */
function calculateBracketConsumption(
  totalConsumption: number,
  bracketMin: number,
  bracketMax: number
): number {
  if (totalConsumption <= bracketMin) {
    return 0;
  }
  
  if (totalConsumption >= bracketMax) {
    return bracketMax - bracketMin;
  }
  
  return totalConsumption - bracketMin;
}

/**
 * Computes electricity cost using progressive tariff structure
 * 
 * @param input - Monthly consumption in kWh
 * @returns Detailed cost breakdown with bracket-by-bracket calculation
 */
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

  const bracketDetails: BracketDetail[] = [];
  let totalMonthlyCost = 0;

  // Calculate cost for each bracket
  for (const bracket of NON_RESIDENTIAL_BT_TARIFF) {
    const consumptionInBracket = calculateBracketConsumption(
      monthlyConsumption,
      bracket.min,
      bracket.max
    );

    if (consumptionInBracket > 0) {
      const costInBracket = consumptionInBracket * bracket.rate;
      totalMonthlyCost += costInBracket;

      bracketDetails.push({
        min: bracket.min,
        max: bracket.max,
        rate: bracket.rate,
        consumption: Number(consumptionInBracket.toFixed(2)),
        cost: Number(costInBracket.toFixed(3))
      });
    }
  }

  const annualCost = totalMonthlyCost * 12;
  const effectiveRate = monthlyConsumption > 0 
    ? totalMonthlyCost / monthlyConsumption 
    : 0;

  return {
    monthlyCost: Number(totalMonthlyCost.toFixed(3)),
    annualCost: Number(annualCost.toFixed(2)),
    effectiveRate: Number(effectiveRate.toFixed(4)),
    bracketDetails
  };
}

