import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { AuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import { Logger } from '@backend/middlewares/logger.midddleware';

export type PvReportData = {
  pvPower: number;
  pvYield: number;
  pvProductionYear1: number;
  coverageRate: number;

  consumptionWithoutPV: number;
  consumptionWithPV: number;

  avgPriceWithoutPV: number;
  avgPriceWithoutPV_mDt: number;
  avgPriceWithPV: number;
  avgPriceWithPV_mDt: number;

  annualSavings: number;

  gainCumulated: number;
  gainDiscounted: number;
  cashflowCumulated: number;
  cashflowDiscounted: number;
  npv: number;
  paybackSimple: number;
  paybackDiscounted: number;
  irr: number;
  roi: number;

  co2PerYear: number;
  co2Total: number;

  // Investment information
  capexPerKwp: number;
  annualOpexRate: number;
  capexTotal: number; // Total investment cost (pvPower * capexPerKwp)
  opexAnnual: number; // Annual maintenance cost (capexTotal * annualOpexRate / 100)
};

// Constants
const DEFAULT_CAPEX_PER_KWP = 2000;
const DEFAULT_ANNUAL_OPEX_RATE = 4;

const round = (n: number, d = 2) =>
  Number.isFinite(n) ? Number(n.toFixed(d)) : 0;

// Shared helper to ensure value is never null/undefined
const ensureNumber = (value: number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }
  return value;
};

/**
 * Build PV report data from Audit Energetique DTO
 * 
 * @throws {Error} When PV data is missing - PV reports require actual PV calculation data.
 * Use buildPvReportDataFromSolaire() when you have solar audit data with PV calculations.
 */
export function buildPvReportData(
  dto: AuditEnergetiqueResponseDto
): PvReportData {
  const r = dto.data?.results;
  if (!r) {
    throw new Error('Invalid Audit Energetique DTO: missing data.results');
  }

  // PV reports require actual PV calculation data
  // This function should not be used for PV reports without solar audit data
  throw new Error(
    'Cannot build PV report without PV data. ' +
    'This function requires solar audit data with PV calculations. ' +
    'Use buildPvReportDataFromSolaire() with AuditSolaireResponseDto instead.'
  );
}

/**
 * Build PV report data from Audit Solaire DTO (with PV calculations)
 * This combines PV-specific data from solar audit with energy audit data
 */
export function buildPvReportDataFromSolaire(
  solaireDto: AuditSolaireResponseDto,
  energetiqueDto?: AuditEnergetiqueResponseDto
): PvReportData {
  
  /* ===============================
     PV DATA FROM SOLAIRE AUDIT
     Direct extraction from DTO with validation
  =============================== */
  
  // Validation warnings for missing critical data
  
  // PV Power: installedPower or systemSize_kWp (kWc)
  // Direct access - these should be populated from calculatePVProduction
  const pvPower = ensureNumber(
    solaireDto.installedPower ?? solaireDto.systemSize_kWp,
    0
  );
  
  // PV Production Year 1: expectedProduction (annualPVProduction from calculator)
  // This is stored as: expectedProduction: pvSystemData.annualPVProduction
  const pvProductionYear1 = ensureNumber(solaireDto.expectedProduction, 0);
  
  // PV Yield: kWh/kWc/an (specific yield from PVGIS)
  // annualProductible = specific yield from PVGIS (kWh/kWp/year) - stored from solarData.annualProductibleKwhPerKwp
  // This is the yield PER kWp, not the total production
  const annualProductible = ensureNumber(solaireDto.annualProductible, 0);
  
  // Calculate yield: if annualProductible exists, use it directly (it's already kWh/kWp/year)
  // Otherwise, calculate from production/power
  const pvYield = annualProductible > 0 
    ? annualProductible  // Direct from PVGIS
    : (pvPower > 0 && pvProductionYear1 > 0 ? pvProductionYear1 / pvPower : 0);
  
  // Coverage Rate: percentage of consumption covered by PV
  const coverageRate = ensureNumber(
    solaireDto.energyCoverageRate ?? solaireDto.coverage,
    0
  );
  
  // Validation and warnings
  if (pvPower === 0) {
    Logger.warn('PV Power is 0 - check installedPower or systemSize_kWp in database');
  }
  if (pvProductionYear1 === 0) {
    Logger.warn('PV Production is 0 - check expectedProduction in database');
  }
  if (annualProductible === 0) {
    Logger.warn('Annual Productible is 0 - check annualProductible (PVGIS data) in database');
  }
  if (coverageRate === 0) {
    Logger.warn('Coverage Rate is 0 - check energyCoverageRate or coverage in database');
  }

  /* ===============================
     CONSUMPTION DATA
  =============================== */
  
  // Use solaire annual consumption, fallback to energetique if available
  const annualConsumption = ensureNumber(
    solaireDto.annualConsumption ?? 
    (energetiqueDto?.data?.results?.energyConsumption?.annual?.value),
    0
  );
  
  const consumptionWithoutPV = annualConsumption;
  
  // Calculate consumption with PV (net consumption after PV production)
  const consumptionWithPV = Math.max(0, annualConsumption - pvProductionYear1);

  /* ===============================
     PRICING DATA
  =============================== */
  
  // Calculate average price from monthly economics if available
  let avgPriceWithoutPV = 0;
  let avgPriceWithPV = 0;
  
  if (solaireDto.monthlyEconomics && solaireDto.monthlyEconomics.length > 0) {
    const totalBillWithout = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + ensureNumber(m.billWithoutPV, 0), 0
    );
    const totalBillWith = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + ensureNumber(m.billWithPV, 0), 0
    );
    const totalConsumptionWithout = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + ensureNumber(m.rawConsumption, 0), 0
    );
    const totalConsumptionWith = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + ensureNumber(m.billedConsumption, 0), 0
    );
    
    avgPriceWithoutPV = totalConsumptionWithout > 0 
      ? totalBillWithout / totalConsumptionWithout 
      : 0;
    // When consumption with PV is 0, average price should be 0 (not fallback to without PV)
    // This happens when PV production fully covers consumption
    avgPriceWithPV = totalConsumptionWith > 0 
      ? totalBillWith / totalConsumptionWith 
      : 0;
  } else if (energetiqueDto?.data?.results?.energyCost?.annual?.value) {
    // Fallback to energetique data
    const annualCost = ensureNumber(energetiqueDto.data.results.energyCost.annual.value, 0);
    avgPriceWithoutPV = annualConsumption > 0 ? annualCost / annualConsumption : 0;
    avgPriceWithPV = avgPriceWithoutPV;
  }

  /* ===============================
     FINANCIAL METRICS FROM SOLAIRE
  =============================== */
  
  // Calculate annualSavings from monthlyEconomics if not directly available
  let annualSavings = ensureNumber(solaireDto.annualSavings, 0);
  if (annualSavings === 0 && solaireDto.monthlyEconomics && solaireDto.monthlyEconomics.length > 0) {
    annualSavings = solaireDto.monthlyEconomics.reduce(
      (sum, month) => sum + ensureNumber(month.monthlySavings, 0),
      0
    );
  }
  // Validate required financial metrics are present
  // These must come from proper economic analysis, not fallback calculations
  const installationCost = ensureNumber(solaireDto.installationCost, 0);
  const annualOpexFromDto = ensureNumber(solaireDto.annualOpex, 0);
  const totalSavings25Years = ensureNumber(solaireDto.totalSavings25Years, 0);
  
  // Check if NPV is null/undefined (not just 0, as NPV can legitimately be 0 for break-even)
  if (solaireDto.npv === null || solaireDto.npv === undefined) {
    const recordId = (solaireDto as any).id || 'unknown';
    throw new Error(
      `Cannot build PV report: NPV (Net Present Value) is missing from solar audit data (ID: ${recordId}). ` +
      'This record appears to be missing economic analysis data. ' +
      'Possible causes: ' +
      '1. This is an old record created before economic analysis was implemented, ' +
      '2. The economic analysis failed during creation, or ' +
      '3. The data was not saved properly. ' +
      'Solution: Please recreate the solar audit simulation to generate proper financial metrics.'
    );
  }
  const npv = ensureNumber(solaireDto.npv, 0);
  
  // Check if IRR is null/undefined
  if (solaireDto.irr === null || solaireDto.irr === undefined) {
    throw new Error(
      'Cannot build PV report: IRR (Internal Rate of Return) is missing from solar audit data. ' +
      'The solar audit must include proper economic analysis with calculated IRR.'
    );
  }
  const irr = ensureNumber(solaireDto.irr, 0);
  
  // Check if ROI is null/undefined
  if (solaireDto.roi25Years === null || solaireDto.roi25Years === undefined) {
    throw new Error(
      'Cannot build PV report: ROI (Return on Investment) is missing from solar audit data. ' +
      'The solar audit must include proper economic analysis with calculated ROI.'
    );
  }
  const roi = ensureNumber(solaireDto.roi25Years, 0);
  
  // Check if payback periods are null/undefined
  if (solaireDto.simplePaybackYears === null || solaireDto.simplePaybackYears === undefined) {
    throw new Error(
      'Cannot build PV report: Simple payback period is missing from solar audit data. ' +
      'The solar audit must include proper economic analysis with calculated payback period.'
    );
  }
  const paybackSimple = ensureNumber(solaireDto.simplePaybackYears, 0);
  
  if (solaireDto.discountedPaybackYears === null || solaireDto.discountedPaybackYears === undefined) {
    throw new Error(
      'Cannot build PV report: Discounted payback period is missing from solar audit data. ' +
      'The solar audit must include proper economic analysis with calculated discounted payback period.'
    );
  }
  const paybackDiscounted = ensureNumber(solaireDto.discountedPaybackYears, 0);
  
  // Validate that values are calculated (not just defaulted to 0)
  // If we have installation cost and savings but all metrics are 0, something is wrong
  if (installationCost > 0 && totalSavings25Years > 0 && npv === 0 && irr === 0 && roi === 0 && paybackSimple === 0) {
    throw new Error(
      'Cannot build PV report: Financial metrics appear to be missing or not calculated. ' +
      'The solar audit has installation cost and savings, but all financial metrics (NPV, IRR, ROI, Payback) are zero. ' +
      'This indicates the economic analysis was not properly executed.'
    );
  }
  
  if (irr === 0) {
    throw new Error(
      'Cannot build PV report: IRR (Internal Rate of Return) is missing. ' +
      'The solar audit must include proper economic analysis with calculated IRR.'
    );
  }
  
  if (roi === 0) {
    throw new Error(
      'Cannot build PV report: ROI (Return on Investment) is missing. ' +
      'The solar audit must include proper economic analysis with calculated ROI.'
    );
  }
  
  if (paybackSimple === 0) {
    throw new Error(
      'Cannot build PV report: Simple payback period is missing. ' +
      'The solar audit must include proper economic analysis with calculated payback period.'
    );
  }
  
  if (paybackDiscounted === 0) {
    throw new Error(
      'Cannot build PV report: Discounted payback period is missing. ' +
      'The solar audit must include proper economic analysis with calculated discounted payback period.'
    );
  }
  
  // Extract cumulative values from year 25 of annualEconomics if available
  // Otherwise, calculate from available financial metrics
  const annualEconomicsLength = solaireDto.annualEconomics?.length ?? 0;
  const year25Data = solaireDto.annualEconomics?.find(ae => ae.year === 25);
  const lastYearData = annualEconomicsLength > 0
    ? (year25Data ?? solaireDto.annualEconomics![annualEconomicsLength - 1])
    : null;
  
  let gainCumulatedFromEconomics: number;
  let gainDiscounted: number;
  let cashflowCumulated: number;
  let cashflowDiscounted: number;
  
  if (lastYearData && annualEconomicsLength > 0) {
    // Use values from annualEconomics if available (most accurate)
    gainCumulatedFromEconomics = ensureNumber(lastYearData.cumulativeNetGain, 0);
    gainDiscounted = ensureNumber(lastYearData.cumulativeNetGainDiscounted, 0);
    cashflowCumulated = ensureNumber(lastYearData.cumulativeCashFlow, 0);
    cashflowDiscounted = ensureNumber(lastYearData.cumulativeCashFlowDiscounted, 0);
  } else {
    // Calculate from available financial metrics (fallback for records without annualEconomics)
    Logger.warn('Annual economics data not available - calculating cumulative values from financial metrics');
    
    // Calculate total OPEX over 25 years (with inflation)
    // Approximate: OPEX increases ~2% per year, so total ≈ annualOpex * 25 * 1.25 (rough average)
    const totalOpex25Years = annualOpexFromDto * 25 * 1.25; // Rough approximation accounting for inflation
    
    // Gain cumulated (non-discounted) = Total savings - Total OPEX
    gainCumulatedFromEconomics = totalSavings25Years - totalOpex25Years;
    
    // Cashflow cumulated = Total savings - Installation cost - Total OPEX
    cashflowCumulated = totalSavings25Years - installationCost - totalOpex25Years;
    
    // Gain discounted: From NPV formula: NPV = -installationCost + cumulativeNetGainDiscounted
    // So: cumulativeNetGainDiscounted = NPV + installationCost
    // This is the sum of all discounted net gains (savings - OPEX) over 25 years
    gainDiscounted = npv + installationCost;
    
    // Cashflow discounted: Similar to gainDiscounted but represents cash flows
    // We can approximate: cashflowDiscounted ≈ gainDiscounted (they're very similar)
    // Or calculate: discountedNetCashFlows = NPV + installationCost (same as gainDiscounted)
    cashflowDiscounted = npv + installationCost;
    
    Logger.warn(
      `Calculated cumulative values from metrics: ` +
      `gainCumulated=${gainCumulatedFromEconomics}, ` +
      `gainDiscounted=${gainDiscounted} (from NPV), ` +
      `cashflowCumulated=${cashflowCumulated}, ` +
      `cashflowDiscounted=${cashflowDiscounted}`
    );
  }
  
  // Validate calculated values are reasonable
  if (gainCumulatedFromEconomics <= 0 && totalSavings25Years > 0) {
    Logger.warn('Calculated gainCumulated is <= 0 - this may indicate an issue with the calculation');
  }
  
  // Calculate CAPEX and OPEX values
  // Prefer values from DTO if available, otherwise calculate from pvPower
  const capexPerKwp = DEFAULT_CAPEX_PER_KWP;
  const annualOpexRate = DEFAULT_ANNUAL_OPEX_RATE;
  const capexTotal = installationCost > 0 ? installationCost : round(pvPower * capexPerKwp, 0);
  const opexAnnual = annualOpexFromDto > 0 ? annualOpexFromDto : round(capexTotal * annualOpexRate / 100, 0);

  /* ===============================
     CO2 DATA
  =============================== */
  
  // Use energetique CO2 data if available, otherwise estimate from consumption
  let co2PerYear = 0;
  if (energetiqueDto?.data?.results?.co2Emissions?.annual?.tons) {
    co2PerYear = ensureNumber(energetiqueDto.data.results.co2Emissions.annual.tons, 0);
  } else {
    // Estimate: ~0.5 kg CO2 per kWh (Tunisian grid average)
    co2PerYear = (annualConsumption * 0.5) / 1000; // Convert to tons
  }
  
  const co2Total = ensureNumber(co2PerYear * 25, 0);

  /* ===============================
     RETURN — PDF SAFE
  =============================== */
  

  return {
    pvPower: round(pvPower, 2),
    pvYield: round(pvYield, 0),
    pvProductionYear1: round(pvProductionYear1, 0),
    coverageRate: round(coverageRate, 1),

    consumptionWithoutPV: round(consumptionWithoutPV, 0),
    consumptionWithPV: round(consumptionWithPV, 0),

    avgPriceWithoutPV: round(avgPriceWithoutPV, 3),
    avgPriceWithoutPV_mDt: round(avgPriceWithoutPV * 1000, 0),

    avgPriceWithPV: round(avgPriceWithPV, 3),
    avgPriceWithPV_mDt: round(avgPriceWithPV * 1000, 0),

    annualSavings: round(annualSavings, 0),

    gainCumulated: round(gainCumulatedFromEconomics, 0),
    gainDiscounted: round(gainDiscounted, 0),
    cashflowCumulated: round(cashflowCumulated, 0),
    cashflowDiscounted: round(cashflowDiscounted, 0),
    npv: round(npv, 0),
    paybackSimple: round(paybackSimple, 2),
    paybackDiscounted: round(paybackDiscounted, 2),
    irr: round(irr, 2),
    roi: round(roi, 2),

    co2PerYear: round(co2PerYear, 2),
    co2Total: round(co2Total, 0),

    // Investment information
    capexPerKwp: capexPerKwp,
    annualOpexRate: annualOpexRate,
    capexTotal: round(capexTotal, 0),
    opexAnnual: round(opexAnnual, 0),
  };
}
