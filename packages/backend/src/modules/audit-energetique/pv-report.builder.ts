import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { AuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { analyzeEconomics } from '../audit-solaire/helpers/economic-analysis.calculator';

export type PvReportData = {
  pvPower: number | null;
  pvYield: number | null;
  pvProductionYear1: number | null;
  coverageRate: number | null;

  consumptionWithoutPV: number | null;
  consumptionWithPV: number | null;

  avgPriceWithoutPV: number | null;
  avgPriceWithoutPV_mDt: number | null;
  avgPriceWithPV: number | null;
  avgPriceWithPV_mDt: number | null;

  annualSavings: number | null;

  gainCumulated: number | null;
  gainDiscounted: number | null;
  cashflowCumulated: number | null;
  cashflowDiscounted: number | null;
  npv: number;
  paybackSimple: number;
  paybackDiscounted: number;
  irr: number;
  roi: number;

  co2PerYear: number | null;
  co2Total: number | null;

  // Investment information
  capexPerKwp: number;
  annualOpexRate: number;
  capexTotal: number | null; // Total investment cost (pvPower * capexPerKwp)
  opexAnnual: number | null; // Annual maintenance cost (capexTotal * annualOpexRate / 100)
};

// Constants
const DEFAULT_CAPEX_PER_KWP = 2000;
const DEFAULT_ANNUAL_OPEX_RATE = 4;

const round = (n: number, d = 2) =>
  Number.isFinite(n) ? Number(n.toFixed(d)) : 0;

/**
 * Validate and normalize a number value
 * Returns null if value is missing or invalid (instead of defaulting to 0)
 * Used for non-critical values that should not have artificial defaults
 */
const validateNumber = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return value;
};

/**
 * Require a number value - throws error if missing or invalid
 * Used for critical financial metrics that must exist
 */
function requireNumber(
  value: number | null | undefined,
  fieldName: string,
  recordId?: string
): number {
  if (value === null || value === undefined) {
    const idPart = recordId ? ` (ID: ${recordId})` : '';
    throw new Error(
      `Cannot build PV report: ${fieldName} is missing from solar audit data${idPart}. ` +
      'The solar audit must include proper economic analysis with calculated financial metrics. ' +
      'Solution: Please recreate the solar audit simulation to generate proper financial metrics.'
    );
  }
  if (!Number.isFinite(value)) {
    throw new Error(
      `Cannot build PV report: ${fieldName} is invalid (NaN or Infinity)`
    );
  }
  return value;
}

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
  const pvPower = validateNumber(
    solaireDto.installedPower ?? solaireDto.systemSize_kWp
  );
  
  // PV Production Year 1: expectedProduction (annualPVProduction from calculator)
  // This is stored as: expectedProduction: pvSystemData.annualPVProduction
  const pvProductionYear1 = validateNumber(solaireDto.expectedProduction);
  
  // PV Yield: kWh/kWc/an (specific yield from PVGIS)
  // annualProductible = specific yield from PVGIS (kWh/kWp/year) - stored from solarData.annualProductibleKwhPerKwp
  // This is the yield PER kWp, not the total production
  const annualProductible = validateNumber(solaireDto.annualProductible);
  
  // Calculate yield: if annualProductible exists, use it directly (it's already kWh/kWp/year)
  // Otherwise, calculate from production/power
  const pvYield = annualProductible !== null
    ? annualProductible  // Direct from PVGIS
    : (pvPower !== null && pvProductionYear1 !== null && pvPower > 0 
      ? pvProductionYear1 / pvPower 
      : null);
  
  // Coverage Rate: percentage of consumption covered by PV
  const coverageRate = validateNumber(
    solaireDto.energyCoverageRate ?? solaireDto.coverage
  );
  
  // Validation and warnings
  if (pvPower === null) {
    Logger.warn('PV Power is missing - check installedPower or systemSize_kWp in database');
  }
  if (pvProductionYear1 === null) {
    Logger.warn('PV Production is missing - check expectedProduction in database');
  }
  if (annualProductible === null) {
    Logger.warn('Annual Productible is missing - check annualProductible (PVGIS data) in database');
  }
  if (coverageRate === null) {
    Logger.warn('Coverage Rate is missing - check energyCoverageRate or coverage in database');
  }

  /* ===============================
     CONSUMPTION DATA
  =============================== */
  
  // Use solaire annual consumption, fallback to energetique if available
  const annualConsumption = validateNumber(
    solaireDto.annualConsumption ?? 
    (energetiqueDto?.data?.results?.energyConsumption?.annual?.value)
  );
  
  const consumptionWithoutPV = annualConsumption;
  
  /* ===============================
     PRICING DATA
     =============================== */
  
  // Calculate average price and consumption with PV from monthly economics only
  let avgPriceWithoutPV = 0;
  let avgPriceWithPV = 0;
  let consumptionWithPV = 0;
  
  Logger.info(`🔍 Checking monthlyEconomics: exists=${!!solaireDto.monthlyEconomics}, length=${solaireDto.monthlyEconomics?.length ?? 0}`);
  
  if (solaireDto.monthlyEconomics && solaireDto.monthlyEconomics.length > 0) {
    Logger.info(`📊 Calculating avg prices from monthlyEconomics (${solaireDto.monthlyEconomics.length} months)`);
    const totalBillWithout = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + (validateNumber(m.billWithoutPV) ?? 0), 0
    );
    const totalBillWith = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + (validateNumber(m.billWithPV) ?? 0), 0
    );
    const totalConsumptionWithout = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + (validateNumber(m.rawConsumption) ?? 0), 0
    );
    const totalConsumptionWith = solaireDto.monthlyEconomics.reduce(
      (sum, m) => sum + (validateNumber(m.billedConsumption) ?? 0), 0
    );
    
    Logger.info(`💰 MonthlyEconomics totals: billWithout=${totalBillWithout}, billWith=${totalBillWith}, consWithout=${totalConsumptionWithout}, consWith=${totalConsumptionWith}`);
    
    // Use billed consumption from monthlyEconomics for display (matches price calculation)
    consumptionWithPV = totalConsumptionWith;
    
    avgPriceWithoutPV = totalConsumptionWithout > 0 
      ? totalBillWithout / totalConsumptionWithout 
      : 0;
    // When consumption with PV is 0, average price should be 0 (not fallback to without PV)
    // This happens when PV production fully covers consumption
    avgPriceWithPV = totalConsumptionWith > 0 
      ? totalBillWith / totalConsumptionWith 
      : 0;
    
    Logger.info(`📈 Calculated avg prices: avgPriceWithoutPV=${avgPriceWithoutPV}, avgPriceWithPV=${avgPriceWithPV}`);
  } else {
    Logger.warn('⚠️ No monthlyEconomics data - consumptionWithPV and avg prices will be null (shown as N/A in PDF)');
  }

  /* ===============================
     FINANCIAL METRICS FROM SOLAIRE
  =============================== */
  
  // Calculate annualSavings from monthlyEconomics if not directly available
  let annualSavings = validateNumber(solaireDto.annualSavings);
  if (annualSavings === null && solaireDto.monthlyEconomics && solaireDto.monthlyEconomics.length > 0) {
    const calculatedSavings = solaireDto.monthlyEconomics.reduce(
      (sum, month) => sum + (validateNumber(month.monthlySavings) ?? 0),
      0
    );
    annualSavings = calculatedSavings > 0 ? calculatedSavings : null;
  }
  // Validate required financial metrics are present
  // These must come from proper economic analysis, not fallback calculations
  const recordId = (solaireDto as any).id || 'unknown';
  const installationCost = validateNumber(solaireDto.installationCost);
  const annualOpexFromDto = validateNumber(solaireDto.annualOpex);
  const totalSavings25Years = validateNumber(solaireDto.totalSavings25Years);
  
  // Require critical financial metrics (throws error if missing/invalid)
  // Note: These values can legitimately be 0 (e.g., NPV = 0 means break-even)
  const npv = requireNumber(solaireDto.npv, 'NPV (Net Present Value)', recordId);
  const irr = requireNumber(solaireDto.irr, 'IRR (Internal Rate of Return)', recordId);
  const roi = requireNumber(solaireDto.roi25Years, 'ROI (Return on Investment)', recordId);
  const paybackSimple = requireNumber(solaireDto.simplePaybackYears, 'Simple Payback Period', recordId);
  const paybackDiscounted = requireNumber(solaireDto.discountedPaybackYears, 'Discounted Payback Period', recordId);
  
  // Validate that values are calculated (not just defaulted to 0)
  // If we have installation cost and savings but all metrics are 0, something is wrong
  if (installationCost !== null && installationCost > 0 && 
      totalSavings25Years !== null && totalSavings25Years > 0 && 
      npv === 0 && irr === 0 && roi === 0 && paybackSimple === 0) {
    throw new Error(
      'Cannot build PV report: Financial metrics appear to be missing or not calculated. ' +
      'The solar audit has installation cost and savings, but all financial metrics (NPV, IRR, ROI, Payback) are zero. ' +
      'This indicates the economic analysis was not properly executed.'
    );
  }
  
  // Extract cumulative values from year 25 of annualEconomics if available
  // Otherwise, try to recalculate from monthlyEconomics, or fallback to financial metrics
  const annualEconomicsLength = solaireDto.annualEconomics?.length ?? 0;
  const year25Data = solaireDto.annualEconomics?.find(ae => ae.year === 25);
  const lastYearData = annualEconomicsLength > 0
    ? (year25Data ?? solaireDto.annualEconomics![annualEconomicsLength - 1])
    : null;
  
  // Debug logging
  Logger.info(
    `📊 Economics data check: annualEconomics.length=${annualEconomicsLength}, ` +
    `monthlyEconomics.length=${solaireDto.monthlyEconomics?.length ?? 0}, ` +
    `pvPower=${pvPower}`
  );
  
  let gainCumulatedFromEconomics: number | null;
  let gainDiscounted: number | null;
  let cashflowCumulated: number | null;
  let cashflowDiscounted: number | null;
  
  if (lastYearData && annualEconomicsLength > 0) {
    // Use values from annualEconomics if available (most accurate)
    gainCumulatedFromEconomics = validateNumber(lastYearData.cumulativeNetGain);
    gainDiscounted = validateNumber(lastYearData.cumulativeNetGainDiscounted);
    cashflowCumulated = validateNumber(lastYearData.cumulativeCashFlow);
    cashflowDiscounted = validateNumber(lastYearData.cumulativeCashFlowDiscounted);
  } else if (solaireDto.monthlyEconomics && solaireDto.monthlyEconomics.length === 12 && pvPower !== null && pvPower > 0) {
    // Try to recalculate annual economics from monthlyEconomics data
    Logger.info(`🔄 Annual economics data not available - recalculating from monthlyEconomics data (${solaireDto.monthlyEconomics.length} months)`);
    
    try {
      const monthlyRawConsumptions = solaireDto.monthlyEconomics.map(m => m.rawConsumption);
      const monthlyBilledConsumptions = solaireDto.monthlyEconomics.map(m => m.billedConsumption);
      
      if (pvProductionYear1 === null) {
        throw new Error('Cannot recalculate: pvProductionYear1 is missing');
      }
      
      const recalculatedEconomics = analyzeEconomics({
        monthlyRawConsumptions,
        monthlyBilledConsumptions,
        installedPowerKwp: pvPower,
        annualPVProduction: pvProductionYear1,
        projectLifetimeYears: 25,
      });
      
      const year25Recalculated = recalculatedEconomics.annualResults.find(ae => ae.year === 25);
      if (year25Recalculated) {
        gainCumulatedFromEconomics = validateNumber(year25Recalculated.cumulativeNetGain);
        gainDiscounted = validateNumber(year25Recalculated.cumulativeNetGainDiscounted);
        cashflowCumulated = validateNumber(year25Recalculated.cumulativeCashFlow);
        cashflowDiscounted = validateNumber(year25Recalculated.cumulativeCashFlowDiscounted);
    
        Logger.info(
          `✅ Recalculated annual economics: ` +
      `gainCumulated=${gainCumulatedFromEconomics}, ` +
          `gainDiscounted=${gainDiscounted}, ` +
      `cashflowCumulated=${cashflowCumulated}, ` +
      `cashflowDiscounted=${cashflowDiscounted}`
    );
      } else {
        throw new Error('Year 25 data not found in recalculated economics');
      }
    } catch (error) {
      const errorMessage = `Cannot build PV report: Failed to recalculate annual economics from monthlyEconomics data. ` +
        `Error: ${(error as Error).message}. ` +
        `The solar audit simulation (ID: ${(solaireDto as any).id || 'unknown'}) is missing annualEconomics data and recalculation failed. ` +
        `Solution: Please recreate the solar audit simulation to generate proper annual economics data.`;
      Logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  } else {
    // No annualEconomics and cannot recalculate - throw error
    const missingData: string[] = [];
    if (!solaireDto.annualEconomics || solaireDto.annualEconomics.length === 0) {
      missingData.push('annualEconomics');
    }
    if (!solaireDto.monthlyEconomics || solaireDto.monthlyEconomics.length === 0) {
      missingData.push('monthlyEconomics');
    }
    if (solaireDto.monthlyEconomics && solaireDto.monthlyEconomics.length > 0 && solaireDto.monthlyEconomics.length !== 12) {
      missingData.push(`monthlyEconomics (has ${solaireDto.monthlyEconomics.length} months, need 12)`);
    }
    if (pvPower === 0) {
      missingData.push('pvPower (is 0)');
    }
    
    const errorMessage = 
      `Cannot build PV report: Required economics data is missing from solar audit simulation (ID: ${(solaireDto as any).id || 'unknown'}). ` +
      `Missing data: ${missingData.join(', ')}. ` +
      `The solar audit must include annualEconomics (25 years) or monthlyEconomics (12 months) with valid pvPower to generate a PV report. ` +
      `Solution: Please recreate the solar audit simulation to generate proper economics data.`;
    
    Logger.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  // Validate calculated values are reasonable
  if (gainCumulatedFromEconomics !== null && gainCumulatedFromEconomics <= 0 && 
      totalSavings25Years !== null && totalSavings25Years > 0) {
    Logger.warn('Calculated gainCumulated is <= 0 - this may indicate an issue with the calculation');
  }
  
  // Calculate CAPEX and OPEX values
  // Prefer values from DTO if available, otherwise calculate from pvPower
  const capexPerKwp = DEFAULT_CAPEX_PER_KWP;
  const annualOpexRate = DEFAULT_ANNUAL_OPEX_RATE;
  const capexTotal = installationCost !== null && installationCost > 0 
    ? installationCost 
    : (pvPower !== null ? round(pvPower * capexPerKwp, 0) : null);
  const opexAnnual = annualOpexFromDto !== null && annualOpexFromDto > 0 
    ? annualOpexFromDto
    : (capexTotal !== null ? round(capexTotal * annualOpexRate / 100, 0) : null);

  /* ===============================
     CO2 DATA
  =============================== */
  
  // Use energetique CO2 data if available, otherwise estimate from consumption
  let co2PerYear: number | null = null;
  if (energetiqueDto?.data?.results?.co2Emissions?.annual?.tons) {
    co2PerYear = validateNumber(energetiqueDto.data.results.co2Emissions.annual.tons);
  } else if (annualConsumption !== null) {
    // Estimate: ~0.5 kg CO2 per kWh (Tunisian grid average)
    co2PerYear = (annualConsumption * 0.5) / 1000; // Convert to tons
  }
  
  const co2Total = co2PerYear !== null ? co2PerYear * 25 : null;

  /* ===============================
     RETURN
     Return null values as-is - missing data should remain null
  =============================== */

  const safeRound = (value: number | null, decimals: number): number | null => {
    return value !== null ? round(value, decimals) : null;
  };

  return {
    pvPower: safeRound(pvPower, 2),
    pvYield: safeRound(pvYield, 0),
    pvProductionYear1: safeRound(pvProductionYear1, 0),
    coverageRate: safeRound(coverageRate, 1),

    consumptionWithoutPV: safeRound(consumptionWithoutPV, 0),
    consumptionWithPV: safeRound(consumptionWithPV, 0),

    avgPriceWithoutPV: safeRound(avgPriceWithoutPV, 3),
    avgPriceWithoutPV_mDt: avgPriceWithoutPV !== null ? round(avgPriceWithoutPV * 1000, 0) : null,

    avgPriceWithPV: safeRound(avgPriceWithPV, 3),
    avgPriceWithPV_mDt: avgPriceWithPV !== null ? round(avgPriceWithPV * 1000, 0) : null,

    annualSavings: safeRound(annualSavings, 0),

    gainCumulated: safeRound(gainCumulatedFromEconomics, 0),
    gainDiscounted: safeRound(gainDiscounted, 0),
    cashflowCumulated: safeRound(cashflowCumulated, 0),
    cashflowDiscounted: safeRound(cashflowDiscounted, 0),
    npv: round(npv, 0),
    paybackSimple: round(paybackSimple / 12, 2), // Convert months to years
    paybackDiscounted: round(paybackDiscounted / 12, 2), // Convert months to years
    irr: round(irr, 2),
    roi: round(roi, 2),

    co2PerYear: safeRound(co2PerYear, 2),
    co2Total: safeRound(co2Total, 0),

    // Investment information
    capexPerKwp: capexPerKwp,
    annualOpexRate: annualOpexRate,
    capexTotal: safeRound(capexTotal, 0),
    opexAnnual: safeRound(opexAnnual, 0),
  };
}

