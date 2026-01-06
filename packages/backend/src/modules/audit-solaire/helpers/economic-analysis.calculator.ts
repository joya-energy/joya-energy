import { Logger } from '@backend/middlewares';

/**

 * This module implements the complete economic analysis for solar PV systems
 * following the Tunisian STEG tariff structure and financial modeling standards.
 * 
 * Key Calculations:
 * - CAPEX: Investment cost (2000 DT/kWp)
 * - OPEX: Annual maintenance cost (4% of CAPEX)
 * - Tariff-based bill calculations (bracket system)
 * - Inflation modeling (STEG 7%, OPEX 3%)
 * - PV degradation (0.4%/year)
 * - ROI, NPV, IRR, Payback period
 * 
 */

export interface EconomicAnalysisInput {
  monthlyBilledConsumptions: number[]; // C_fact(m) - Billed consumption after PV credit [12 elements]
  monthlyRawConsumptions: number[]; // C_brut(m) - Raw consumption before PV [12 elements]
  installedPowerKwp: number; // P_PV (kWc)
  projectLifetimeYears?: number; // Default 25 years
  stegTariffInflationRate?: number; // Default 7% - i
  opexInflationRate?: number; // Default 3% - i_OPEX
  discountRate?: number; // Default 8% - r
  pvDegradationRate?: number; // Default 0.4% - d
  capexPerKwp?: number; // Default 2000 DT/kWp
  opexRatePercentage?: number; // Default 4% of CAPEX - α
}

export interface MonthlyEconomicResult {
  month: number;
  rawConsumption: number; // C_brut(m)
  billedConsumption: number; // C_fact(m)
  appliedTariffRate: number; // DT/kWh
  billWithoutPV: number; // F_sans(m)
  billWithPV: number; // F_avec(m)
  monthlySavings: number; // Eco(m)
}

export interface AnnualEconomicResult {
  year: number;
  annualRawConsumption: number; // Σ C_brut(m)
  annualBilledConsumption: number; // Σ C_fact(m)
  annualBillWithoutPV: number; // F_sans annual
  annualBillWithPV: number; // F_avec annual
  annualSavings: number; // Eco_brute(n)
  averageAvoidedTariff: number; // Tarif évité (DT/kWh)
  capex: number; // Investment (year 1 only)
  opex: number; // OPEX(n)
  netGain: number; // Gain_net(n) = Savings - OPEX
  cumulativeCashFlow: number; // CF_cumulé(n)
  cumulativeCashFlowDiscounted: number; // CF_cumulé,act(n)
  cumulativeNetGain: number; // Σ Gain_net
  cumulativeNetGainDiscounted: number; // Σ Gain_net actualisé
}

export interface EconomicAnalysisResult {
  investmentCost: number; // CAPEX
  annualMaintenanceCost: number; // OPEX Year 1
  monthlyResults: MonthlyEconomicResult[];
  annualResults: AnnualEconomicResult[];
  totalSavings25Years: number;
  simplePaybackYears: number;
  discountedPaybackYears: number;
  returnOnInvestmentPercent: number; // ROI (%)
  netPresentValue: number; // NPV/VAN (DT)
  internalRateOfReturnPercent: number; // IRR/TRI (%)
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * STEG Non-Residential BT Tariff Structure (>100 kWh/month)
 * Uses bracket-based system: each bracket has a fixed rate
 * Consumption in bracket determines the applicable rate
 */
interface TariffBracket {
  minKwh: number;
  maxKwh: number;
  ratePerKwh: number; 
}

const STEG_TARIFF_BRACKETS: TariffBracket[] = [
  { minKwh: 0, maxKwh: 200, ratePerKwh: 0.195 },
  { minKwh: 200, maxKwh: 300, ratePerKwh: 0.240 },
  { minKwh: 300, maxKwh: 500, ratePerKwh: 0.333 },
  { minKwh: 500, maxKwh: Infinity, ratePerKwh: 0.391 },
];

const DEFAULT_PROJECT_LIFETIME_YEARS = 25;
const DEFAULT_STEG_TARIFF_INFLATION = 0.07; // 7%
const DEFAULT_OPEX_INFLATION = 0.03; // 3%
const DEFAULT_DISCOUNT_RATE = 0.08; // 8%
const DEFAULT_PV_DEGRADATION_RATE = 0.004; // 0.4%
const DEFAULT_CAPEX_PER_KWP = 2000; // DT/kWp
const DEFAULT_OPEX_RATE_PERCENTAGE = 0.04; // 4% of CAPEX


/**
 * Determine applicable STEG tariff rate based on monthly consumption bracket
 * 
 * Logic: Based on total monthly consumption, find which bracket it falls into
 * and apply that bracket's rate to the ENTIRE consumption.
 * 
 * Example:
 * - 150 kWh → 0.195 DT/kWh (bracket 0-200)
 * - 250 kWh → 0.240 DT/kWh (bracket 200-300)
 * - 450 kWh → 0.333 DT/kWh (bracket 300-500)
 * - 600 kWh → 0.391 DT/kWh (bracket 500+)
 * 
 * @param consumptionKwh - Monthly consumption in kWh
 * @returns Applicable tariff rate in DT/kWh
 */
export function determineApplicableTariffRate(consumptionKwh: number): number {
  if (consumptionKwh < 0) {
    throw new Error(`Invalid consumption: ${consumptionKwh}. Must be non-negative.`);
  }

  if (consumptionKwh === 0) {
    return 0;
  }

  // Find the bracket that contains this consumption level
  for (const bracket of STEG_TARIFF_BRACKETS) {
    if (consumptionKwh > bracket.minKwh && consumptionKwh <= bracket.maxKwh) {
      return bracket.ratePerKwh;
    }
  }

  // Should never reach here due to Infinity in last bracket
  return STEG_TARIFF_BRACKETS[STEG_TARIFF_BRACKETS.length - 1].ratePerKwh;
}

/**
 * Calculate monthly electricity bill
 * Formula: Bill = Consumption × Applicable_Tariff_Rate
 * 
 * @param consumptionKwh - Monthly consumption in kWh
 * @returns Monthly bill in DT
 */
function calculateMonthlyBill(consumptionKwh: number): number {
  const tariffRate = determineApplicableTariffRate(consumptionKwh);
  return Number((consumptionKwh * tariffRate).toFixed(2));
}

/**
 * Calculate monthly bill WITHOUT solar PV
 * F_sans(m) = C_brut(m) × Tarif_STEG
 */
export function calculateBillWithoutPV(rawConsumptionKwh: number): number {
  return calculateMonthlyBill(rawConsumptionKwh);
}

/**
 * Calculate monthly bill WITH solar PV
 * F_avec(m) = C_fact(m) × Tarif_STEG
 */
export function calculateBillWithPV(billedConsumptionKwh: number): number {
  return calculateMonthlyBill(billedConsumptionKwh);
}

/**
 * Calculate monthly savings from solar PV
 * Eco(m) = F_sans(m) - F_avec(m)
 */
export function calculateMonthlySavings(
  rawConsumptionKwh: number,
  billedConsumptionKwh: number
): number {
  const billWithout = calculateBillWithoutPV(rawConsumptionKwh);
  const billWith = calculateBillWithPV(billedConsumptionKwh);
  return Number((billWithout - billWith).toFixed(2));
}

/**
 * Calculate average avoided tariff (price per saved kWh)
 * 
 * Tarif évité = (Σ F_sans(m) - Σ F_avec(m)) / (Σ C_brut(m) - Σ C_fact(m))
 * 
 * This represents the average value of each kWh saved by solar PV.
 */
export function calculateAverageAvoidedTariff(
  monthlyRawConsumptions: number[],
  monthlyBilledConsumptions: number[]
): number {
  const totalBillWithout = monthlyRawConsumptions.reduce(
    (sum, consumption) => sum + calculateBillWithoutPV(consumption),
    0
  );

  const totalBillWith = monthlyBilledConsumptions.reduce(
    (sum, consumption) => sum + calculateBillWithPV(consumption),
    0
  );

  const totalSavedEnergy = monthlyRawConsumptions.reduce(
    (sum, rawCons, index) => sum + (rawCons - monthlyBilledConsumptions[index]),
    0
  );

  if (totalSavedEnergy === 0) {
    return 0;
  }

  return Number(((totalBillWithout - totalBillWith) / totalSavedEnergy).toFixed(4));
}



/**
 * Calculate CAPEX (Capital Expenditure)
 * CAPEX = Prix_par_kWc × P_PV
 * 
 * @param installedPowerKwp - Installed PV power in kWp
 * @param capexPerKwp - Cost per kWp (default: 2000 DT/kWp)
 * @returns Total investment cost in DT
 */
export function calculateCapex(installedPowerKwp: number, capexPerKwp: number): number {
  return Number((installedPowerKwp * capexPerKwp).toFixed(2));
}

/**
 * Calculate annual OPEX (Operational Expenditure)
 * OPEX_annuel = α × CAPEX
 * 
 * @param capex - Investment cost in DT
 * @param opexRatePercentage - OPEX rate as decimal (default: 0.04 = 4%)
 * @returns Annual OPEX in DT
 */
export function calculateAnnualOpex(
  capex: number,
  opexRatePercentage: number = DEFAULT_OPEX_RATE_PERCENTAGE
): number {
  return Number((capex * opexRatePercentage).toFixed(2));
}

/**
 * Calculate annual savings with STEG inflation and PV degradation
 * 
 * Formula: Eco_brute(n) = Eco_brute,1 × (1+i)^(n-1) × (1-d)^(n-1)
 * 
 * Where:
 * - i = STEG tariff inflation rate (7%)
 * - d = PV degradation rate (0.4%)
 * - n = year number
 * 
 * Logic:
 * - Tariff increases → each saved kWh worth more
 * - PV degrades → less energy produced
 */
export function calculateAnnualSavingsWithInflationAndDegradation(
  firstYearSavings: number,
  yearNumber: number,
  stegInflationRate: number = DEFAULT_STEG_TARIFF_INFLATION,
  pvDegradationRate: number = DEFAULT_PV_DEGRADATION_RATE
): number {
  if (yearNumber === 1) {
    return firstYearSavings;
  }

  const yearsElapsed = yearNumber - 1;
  const inflationMultiplier = Math.pow(1 + stegInflationRate, yearsElapsed);
  const degradationMultiplier = Math.pow(1 - pvDegradationRate, yearsElapsed);

  return Number((firstYearSavings * inflationMultiplier * degradationMultiplier).toFixed(2));
}

/**
 * Calculate OPEX with inflation
 * 
 * Formula: OPEX(n) = OPEX_1 × (1+i_OPEX)^(n-1)
 * 
 * Where:
 * - i_OPEX = OPEX inflation rate (3%)
 * - n = year number
 */
export function calculateOpexWithInflation(
  firstYearOpex: number,
  yearNumber: number,
  opexInflationRate: number = DEFAULT_OPEX_INFLATION
): number {
  if (yearNumber === 1) {
    return firstYearOpex;
  }

  const yearsElapsed = yearNumber - 1;
  const inflationMultiplier = Math.pow(1 + opexInflationRate, yearsElapsed);

  return Number((firstYearOpex * inflationMultiplier).toFixed(2));
}

/**
 * Calculate net gain for a specific year
 * 
 * Formula: Gain_net(n) = Eco_brute(n) - OPEX(n)
 * 
 * This is the actual profit after maintenance costs.
 */
export function calculateNetGain(annualSavings: number, annualOpex: number): number {
  return Number((annualSavings - annualOpex).toFixed(2));
}

/**
 * Calculate discounted cash flow (present value)
 * 
 * Formula: CF_act(n) = CF(n) / (1+r)^n
 * 
 * Where:
 * - r = discount rate (8%)
 * - n = year number
 */
export function calculateDiscountedValue(
  futureValue: number,
  yearNumber: number,
  discountRate: number = DEFAULT_DISCOUNT_RATE
): number {
  if (yearNumber === 0) {
    return futureValue; // No discounting for year 0
  }

  const discountFactor = Math.pow(1 + discountRate, yearNumber);
  return Number((futureValue / discountFactor).toFixed(2));
}


/**
 * Calculate simple payback period (years)
 * 
 * Simple payback is when: Σ Gain_net(n) = CAPEX
 * 
 * This ignores time value of money.
 */
export function calculateSimplePayback(
  investmentCost: number,
  annualResults: AnnualEconomicResult[]
): number {
  let cumulativeGain = 0;

  for (const result of annualResults) {
    cumulativeGain += result.netGain;
    if (cumulativeGain >= investmentCost) {
      return result.year;
    }
  }

  return 0; 
}

/**
 * Calculate discounted payback period (years)
 * 
 * Discounted payback is when: Σ Gain_net(n)/(1+r)^n = CAPEX
 * 
 * This accounts for time value of money.
 */
export function calculateDiscountedPayback(
  investmentCost: number,
  annualResults: AnnualEconomicResult[]
): number {
  let cumulativeDiscountedGain = 0;

  for (const result of annualResults) {
    cumulativeDiscountedGain += result.cumulativeNetGainDiscounted;
    if (cumulativeDiscountedGain >= investmentCost) {
      return result.year;
    }
  }

  return 0; 
}

/**
 * Calculate ROI (Return on Investment) over project lifetime
 * 
 * Formula: ROI = [(Σ Gain_net(n)) - CAPEX] / CAPEX × 100
 * 
 * Returns percentage profit relative to initial investment.
 */
export function calculateROI(
  investmentCost: number,
  annualResults: AnnualEconomicResult[]
): number {
  const totalNetGain = annualResults.reduce((sum, result) => sum + result.netGain, 0);
  const roiPercent = ((totalNetGain - investmentCost) / investmentCost) * 100;

  return Number(roiPercent.toFixed(2));
}

/**
 * Calculate NPV (Net Present Value) / VAN (Valeur Actuelle Nette)
 * 
 * Formula: VAN = -CAPEX + Σ [Gain_net(n) / (1+r)^n]
 * 
 * NPV > 0 → Project is profitable
 * NPV < 0 → Project loses money
 * NPV = 0 → Break-even
 * 
 * Note: We use the last year's cumulativeNetGainDiscounted which already contains
 * the sum of all discounted net gains over the project lifetime.
 */
export function calculateNPV(
  investmentCost: number,
  annualResults: AnnualEconomicResult[]
): number {
  if (annualResults.length === 0) {
    return -investmentCost;
  }

  // Use the last year's cumulative discounted net gain
  // This already contains the sum of all discounted net gains (Σ [Gain_net(n) / (1+r)^n])
  const lastYear = annualResults[annualResults.length - 1];
  const totalDiscountedGain = lastYear.cumulativeNetGainDiscounted;

  const npv = -investmentCost + totalDiscountedGain;
  return Number(npv.toFixed(2));
}

/**
 * Calculate IRR (Internal Rate of Return) / TRI (Taux de Rentabilité Interne)
 * 
 * IRR is the discount rate where NPV = 0
 * 
 * Formula: 0 = -CAPEX + Σ [Gain_net(n) / (1+IRR)^n]
 * 
 * Uses iterative approximation (Newton's method simplified).
 */
export function calculateIRR(
  investmentCost: number,
  annualResults: AnnualEconomicResult[]
): number {
  const maxIterations = 100;
  const tolerance = 1; 
  let irr = 0.1; 

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const npvAtRate = calculateNPVAtRate(investmentCost, annualResults, irr);

    if (Math.abs(npvAtRate) < tolerance) {
      break; 
    }

    irr += npvAtRate > 0 ? 0.005 : -0.005;

    irr = Math.max(0, Math.min(1, irr));
  }

  return Number((irr * 100).toFixed(2));
}

/**
 * Helper: Calculate NPV at a specific discount rate
 */
function calculateNPVAtRate(
  investmentCost: number,
  annualResults: AnnualEconomicResult[],
  rate: number
): number {
  let npv = -investmentCost;

  for (const result of annualResults) {
    const presentValue = result.netGain / Math.pow(1 + rate, result.year);
    npv += presentValue;
  }

  return npv;
}

/**
 * Perform complete economic analysis for solar PV system
 * 
 * This is the main entry point that orchestrates all calculations:
 * 1. Monthly economics (Year 1)
 * 2. Annual projections (25 years)
 * 3. Financial metrics (ROI, NPV, IRR, Payback)
 * 
 * @param input - Analysis parameters and consumption data
 * @returns Complete economic analysis results
 */
export function analyzeEconomics(input: EconomicAnalysisInput): EconomicAnalysisResult {
  // Extract parameters with defaults
  const projectLifetimeYears = input.projectLifetimeYears ?? DEFAULT_PROJECT_LIFETIME_YEARS;
  const stegInflationRate = input.stegTariffInflationRate ?? DEFAULT_STEG_TARIFF_INFLATION;
  const opexInflationRate = input.opexInflationRate ?? DEFAULT_OPEX_INFLATION;
  const discountRate = input.discountRate ?? DEFAULT_DISCOUNT_RATE;
  const pvDegradationRate = input.pvDegradationRate ?? DEFAULT_PV_DEGRADATION_RATE;
  const capexPerKwp = input.capexPerKwp ?? DEFAULT_CAPEX_PER_KWP;
  const opexRatePercentage = input.opexRatePercentage ?? DEFAULT_OPEX_RATE_PERCENTAGE;

  Logger.info(`Starting economic analysis: ${projectLifetimeYears} years, ${input.installedPowerKwp} kWp @ ${capexPerKwp} DT/kWp`);

  const monthlyResults: MonthlyEconomicResult[] = [];

  for (let month = 1; month <= 12; month++) {
    const index = month - 1;
    const rawConsumption = input.monthlyRawConsumptions[index];
    const billedConsumption = input.monthlyBilledConsumptions[index];

    monthlyResults.push({
      month,
      rawConsumption: Number(rawConsumption.toFixed(2)),
      billedConsumption: Number(billedConsumption.toFixed(2)),
      appliedTariffRate: determineApplicableTariffRate(billedConsumption),
      billWithoutPV: calculateBillWithoutPV(rawConsumption),
      billWithPV: calculateBillWithPV(billedConsumption),
      monthlySavings: calculateMonthlySavings(rawConsumption, billedConsumption),
    });
  }

  const year1RawConsumption = input.monthlyRawConsumptions.reduce((sum, cons) => sum + cons, 0);
  const year1BilledConsumption = input.monthlyBilledConsumptions.reduce((sum, cons) => sum + cons, 0);
  const year1BillWithout = monthlyResults.reduce((sum, month) => sum + month.billWithoutPV, 0);
  const year1BillWith = monthlyResults.reduce((sum, month) => sum + month.billWithPV, 0);
  const year1Savings = monthlyResults.reduce((sum, month) => sum + month.monthlySavings, 0);

  const averageAvoidedTariff = calculateAverageAvoidedTariff(input.monthlyRawConsumptions, input.monthlyBilledConsumptions);

  const investmentCost = calculateCapex(input.installedPowerKwp, capexPerKwp);
  const year1Opex = calculateAnnualOpex(investmentCost, opexRatePercentage);

  const annualResults: AnnualEconomicResult[] = [];
  let cumulativeCashFlow = -investmentCost; 
  let cumulativeCashFlowDiscounted = -investmentCost;
  let cumulativeNetGain = 0;
  let cumulativeNetGainDiscounted = 0;

  for (let year = 1; year <= projectLifetimeYears; year++) {
    const annualSavings = calculateAnnualSavingsWithInflationAndDegradation(
      year1Savings,
      year,
      stegInflationRate,
      pvDegradationRate
    );

    const annualOpex = calculateOpexWithInflation(year1Opex, year, opexInflationRate);
    const netGain = calculateNetGain(annualSavings, annualOpex);

    // Update cumulative values
    cumulativeCashFlow += netGain;
    cumulativeNetGain += netGain;

    const discountedNetGain = calculateDiscountedValue(netGain, year, discountRate);
    cumulativeCashFlowDiscounted += discountedNetGain;
    cumulativeNetGainDiscounted += discountedNetGain;

    // Calculate bills with inflation
    const annualBillWithout = calculateAnnualSavingsWithInflationAndDegradation(
      year1BillWithout,
      year,
      stegInflationRate,
      0 
    );

    const annualBillWith = calculateAnnualSavingsWithInflationAndDegradation(
      year1BillWith,
      year,
      stegInflationRate,
      0
    );

    annualResults.push({
      year,
      annualRawConsumption: year1RawConsumption,
      annualBilledConsumption: year1BilledConsumption,
      annualBillWithoutPV: annualBillWithout,
      annualBillWithPV: annualBillWith,
      annualSavings,
      averageAvoidedTariff,
      capex: year === 1 ? investmentCost : 0,
      opex: annualOpex,
      netGain,
      cumulativeCashFlow: Number(cumulativeCashFlow.toFixed(2)),
      cumulativeCashFlowDiscounted: Number(cumulativeCashFlowDiscounted.toFixed(2)),
      cumulativeNetGain: Number(cumulativeNetGain.toFixed(2)),
      cumulativeNetGainDiscounted: Number(cumulativeNetGainDiscounted.toFixed(2)),
    });
  }

  const totalSavings25Years = annualResults.reduce((sum, result) => sum + result.annualSavings, 0);
  const simplePaybackYears = calculateSimplePayback(investmentCost, annualResults);
  const discountedPaybackYears = calculateDiscountedPayback(investmentCost, annualResults);
  const returnOnInvestmentPercent = calculateROI(investmentCost, annualResults);
  const netPresentValue = calculateNPV(investmentCost, annualResults);
  const internalRateOfReturnPercent = calculateIRR(investmentCost, annualResults);

  Logger.info(
    `Economic analysis complete: NPV=${netPresentValue} DT, IRR=${internalRateOfReturnPercent}%, ` +
    `Payback=${simplePaybackYears} years, ROI=${returnOnInvestmentPercent}%`
  );

  
  return {
    investmentCost,
    annualMaintenanceCost: year1Opex,
    monthlyResults,
    annualResults,
    totalSavings25Years: Number(totalSavings25Years.toFixed(2)),
    simplePaybackYears,
    discountedPaybackYears,
    returnOnInvestmentPercent,
    netPresentValue,
    internalRateOfReturnPercent,
  };
}
