import { Logger } from '@backend/middlewares';

export interface PVProductionInput {
  annualConsumption: number; // Eann (kWh/an)
  annualProductible: number; // Annual productible from PVGIS (kWh/kWp/an) - already includes system losses
  monthlyProductible: number[]; // Monthly productible from PVGIS (kWh/kWp) [12 elements] - already includes system losses
  monthlyConsumptions: number[]; // C_brut(m) - Monthly raw consumption (kWh) [12 elements]
  installedPower?: number; // P_PV (kWc) - Optional, will be calculated if not provided
}

export interface MonthlyPVProduction {
  month: number;
  rawConsumption: number; // C_brut(m) - Raw consumption
  pvProduction: number; // Prod(m) - PV production
  netConsumption: number; // C_fact(m) - Billed consumption (what you pay for)
  credit: number; // Cr(m) - Energy credit (negative = surplus)
}

export interface PVProductionResult {
  installedPower: number; // P_PV (kWc)
  annualProducible: number; // Yspec (kWh/an)
  annualPVProduction: number; // EPV (kWh/an)
  monthlyProductions: MonthlyPVProduction[];
  energyCoverageRate: number; // Taux_couv (%)
}

export function calculateAnnualProducible(
  monthlyProductible: number[],
  installedPower: number
): number {
  const monthlyProduction = monthlyProductible.map(
    productible => productible * installedPower
  );

  const annualProducible = monthlyProduction.reduce((sum, value) => sum + value, 0);
  return Number(annualProducible.toFixed(2));
}

/**
 * Calculate theoretical PV power
 * PPV,th = Eann / Yspec (kWc)
 */
export function calculateTheoreticalPVPower(
  annualConsumption: number,
  annualProducible: number
): number {
  if (annualProducible === 0) {
    Logger.warn('Annual producible is zero, cannot calculate theoretical PV power');
    return 0;
  }

  const theoreticalPower = annualConsumption / annualProducible;
  return Number(theoreticalPower.toFixed(2));
}

/**
 * Determine installed PV power
 * 
 * According to the document methodology:
 * P_PV,inst = PPV,th = Eann / Yspec
 * 
 * The installed power equals the theoretical power needed to cover consumption.
 * 
 * @param theoreticalPower - Theoretical PV power (kWc)
 * @returns Installed PV power (kWc)
 */
export function calculateInstalledPVPower(theoreticalPower: number): number {
  return Number(theoreticalPower.toFixed(2));
}

export function calculateMonthlyPVProduction(
  installedPower: number,
  monthlyProductible: number[]
): number[] {
  return monthlyProductible.map(productible =>
    Number((installedPower * productible).toFixed(2))
  );
}

export function calculateNetConsumptionAndCredits(
  monthlyRawConsumptions: number[],
  monthlyPVProductions: number[]
): MonthlyPVProduction[] {
  const results: MonthlyPVProduction[] = [];
  let previousCredit = 0;

  for (let month = 1; month <= 12; month++) {
    const index = month - 1;
    const rawConsumption = monthlyRawConsumptions[index];
    const pvProduction = monthlyPVProductions[index];

    const netBeforeCredit = rawConsumption - pvProduction;
    const balance = netBeforeCredit + previousCredit;

    let billedConsumption: number;
    let credit: number;

    if (balance < 0) {
      billedConsumption = 0;
      credit = balance;
    } else if (balance > 0) {
      billedConsumption = balance;
      credit = 0;
    } else {
      billedConsumption = 0;
      credit = 0;
    }

    results.push({
      month,
      rawConsumption: Number(rawConsumption.toFixed(2)),
      pvProduction: Number(pvProduction.toFixed(2)),
      netConsumption: Number(billedConsumption.toFixed(2)),
      credit: Number(credit.toFixed(2)),
    });

    previousCredit = credit;
  }

  return results;
}

/**
 * Calculate energy coverage rate
 * Taux_couv = EPV / Eann
 */
export function calculateEnergyCoverageRate(
  annualPVProduction: number,
  annualConsumption: number
): number {
  if (annualConsumption === 0) {
    return 0;
  }

  const coverageRate = (annualPVProduction / annualConsumption) * 100;
  return Number(coverageRate.toFixed(2));
}

/**
 * Main function to calculate PV production and net consumption
 * 
 * Implements the document methodology:
 * 1. PPV,th = Eann / Yspec (Yspec from PVGIS)
 * 2. P_PV,inst = PPV,th
 * 3. Prod(m) = P_PV × Y_mensuel(m)
 * 4. Apply credit rollover logic
 * 5. Calculate coverage rate
 * 
 * @param input - PV production input parameters
 * @returns Complete PV production results with monthly details
 */
export function calculatePVProduction(input: PVProductionInput): PVProductionResult {
  Logger.info(`Calculating PV production for ${input.annualConsumption} kWh annual consumption`);

  // Step 1: Calculate theoretical PV power (PPV,th = Eann / Yspec)

  const theoreticalPower = calculateTheoreticalPVPower(
    input.annualConsumption,
    input.annualProductible
  );

  // Step 2: Determine installed power P_PV,inst = PPV,th 
  const installedPower = input.installedPower ?? calculateInstalledPVPower(theoreticalPower);

  // Step 3: Calculate annual producible for the installed system Yspec_installed = Yspec × P_PV
  const annualProducible = calculateAnnualProducible(input.monthlyProductible, installedPower);

  // Step 4: Calculate monthly PV production Prod(m) = P_PV × Y_mensuel(m)
  const monthlyPVProductions = calculateMonthlyPVProduction(installedPower, input.monthlyProductible);

  // Step 5: Apply credit rollover logic Calculate C_fact(m) and Cr(m) with rollover
  const monthlyProductions = calculateNetConsumptionAndCredits(input.monthlyConsumptions, monthlyPVProductions);

  // Step 6: Calculate annual production and coverage Taux_couv = EPV / Eann
  const annualPVProduction = monthlyPVProductions.reduce((sum, prod) => sum + prod, 0);
  const energyCoverageRate = calculateEnergyCoverageRate(annualPVProduction, input.annualConsumption);

  Logger.info(`PV System: ${installedPower} kWc, Annual production: ${annualPVProduction} kWh, Coverage: ${energyCoverageRate}%`);

  return {
    installedPower,
    annualProducible: Number(annualProducible.toFixed(2)),
    annualPVProduction: Number(annualPVProduction.toFixed(2)),
    monthlyProductions,
    energyCoverageRate,
  };
}
