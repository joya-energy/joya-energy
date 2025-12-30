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
};

const round = (n: number, d = 2) =>
  Number.isFinite(n) ? Number(n.toFixed(d)) : 0;

/**
 * Build PV report data from Audit Energetique DTO
 * This is used when only energy audit data is available (no PV calculations yet)
 */
export function buildPvReportData(
  dto: AuditEnergetiqueResponseDto
): PvReportData {
  // Helper to ensure value is never null/undefined
  const ensureNumber = (value: number | null | undefined, defaultValue: number = 0): number => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return defaultValue;
    }
    return value;
  };

  const r = dto.data?.results;
  if (!r) {
    throw new Error('Invalid Audit Energetique DTO: missing data.results');
  }

  /* ===============================
     AVAILABLE DATA
  =============================== */

  const annualConsumption = ensureNumber(r.energyConsumption?.annual?.value, 0);
  const annualCost = ensureNumber(r.energyCost?.annual?.value, 0);

  const avgPriceWithoutPV =
    annualConsumption > 0 ? annualCost / annualConsumption : 0;

  const co2PerYear = ensureNumber(r.co2Emissions?.annual?.tons, 0);

  /* ===============================
     PV DATA — NOT YET AVAILABLE
     (SAFE DEFAULTS)
  =============================== */

  const pvPower = 0;
  const pvYield = 0;
  const pvProductionYear1 = 0;
  const coverageRate = 0;

  const consumptionWithoutPV = annualConsumption;
  const consumptionWithPV = annualConsumption;

  const avgPriceWithPV = avgPriceWithoutPV;
  const annualSavings = 0;

  const gainCumulated = 0;
  const gainDiscounted = 0;
  const cashflowCumulated = 0;
  const cashflowDiscounted = 0;
  const npv = 0;
  const irr = 0;
  const roi = 0;
  const paybackSimple = 0;
  const paybackDiscounted = 0;

  const co2Total = co2PerYear * 25;

  /* ===============================
     RETURN — PDF SAFE
  =============================== */

  return {
    pvPower,
    pvYield,
    pvProductionYear1,
    coverageRate,

    consumptionWithoutPV: round(consumptionWithoutPV, 0),
    consumptionWithPV: round(consumptionWithPV, 0),

    avgPriceWithoutPV: round(avgPriceWithoutPV, 3),
    avgPriceWithoutPV_mDt: round(avgPriceWithoutPV * 1000, 0),

    avgPriceWithPV: round(avgPriceWithPV, 3),
    avgPriceWithPV_mDt: round(avgPriceWithPV * 1000, 0),

    annualSavings: round(annualSavings, 0),

    gainCumulated: round(gainCumulated, 0),
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
  };
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
     VALIDATION - NO NULL/UNDEFINED
  =============================== */
  
  // Helper to ensure value is never null/undefined
  const ensureNumber = (value: number | null | undefined, defaultValue: number = 0): number => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return defaultValue;
    }
    return value;
  };
  
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
  const gainCumulated = ensureNumber(solaireDto.totalSavings25Years, 0);
  const npv = ensureNumber(solaireDto.npv, 0);
  let irr = ensureNumber(solaireDto.irr, 0);
  let roi = ensureNumber(solaireDto.roi25Years, 0);
  let paybackSimple = ensureNumber(solaireDto.simplePaybackYears, 0);
  let paybackDiscounted = ensureNumber(solaireDto.discountedPaybackYears, 0);
  
  // FALLBACK: Calculate profitability indicators if not available
  const installationCost = ensureNumber(solaireDto.installationCost, 0);
  if (paybackSimple === 0 && annualSavings > 0 && installationCost > 0) {
    // Simple payback = investment cost / annual savings
    paybackSimple = installationCost / annualSavings;
  }
  
  // ROI calculation will be done after gainCumulatedFromEconomics is calculated
  // (moved to after fallback calculations)
  
  if (paybackDiscounted === 0 && paybackSimple > 0) {
    // Discounted payback is typically 20-30% longer than simple payback
    // Using 25% as a rough estimate
    paybackDiscounted = paybackSimple * 1.25;
    console.log('📊 Estimated discounted payback:', paybackDiscounted);
  }
  
  if (irr === 0 && annualSavings > 0 && installationCost > 0) {
    // IRR approximation: For a simple case, IRR ≈ annualSavings / installationCost
    // But this is a very rough estimate. Real IRR requires iterative calculation.
    // Using a formula: IRR ≈ (annualSavings / installationCost) * 100 / paybackSimple
    // This gives a ballpark figure
    if (paybackSimple > 0) {
      irr = (annualSavings / installationCost) * 100 / paybackSimple;
      // Cap at reasonable values (IRR typically 5-25% for solar)
      irr = Math.min(Math.max(irr, 5), 25);
    }
    console.log('📊 Estimated IRR:', irr);
  }
  
  // Extract cumulative values from year 25 of annualEconomics
  // Try to find year 25 specifically, otherwise use the last year
  const annualEconomicsLength = solaireDto.annualEconomics?.length ?? 0;
  const year25Data = solaireDto.annualEconomics?.find(ae => ae.year === 25);
  const lastYearData = annualEconomicsLength > 0
    ? (year25Data ?? solaireDto.annualEconomics![annualEconomicsLength - 1])
    : null;
  
  
  // Gain cumulé non actualisé = cumulativeNetGain (year 25)
  // If annualEconomics is not available, calculate from available data
  let gainCumulatedFromEconomics = ensureNumber(lastYearData?.cumulativeNetGain, 0);
  let gainDiscounted = ensureNumber(lastYearData?.cumulativeNetGainDiscounted, 0);
  let cashflowCumulated = ensureNumber(lastYearData?.cumulativeCashFlow, 0);
  let cashflowDiscounted = ensureNumber(lastYearData?.cumulativeCashFlowDiscounted, 0);
  
  // FALLBACK: If annualEconomics is empty, estimate from available data
  if (!lastYearData && annualEconomicsLength === 0) {
    Logger.warn('annualEconomics is empty - using fallback calculations');
    
    // Use totalSavings25Years if available (this is the sum of all annual savings)
    const totalSavings25Years = ensureNumber(solaireDto.totalSavings25Years, 0);
    const installationCost = ensureNumber(solaireDto.installationCost, 0);
    const annualOpex = ensureNumber(solaireDto.annualOpex, 0);
    
    if (totalSavings25Years > 0) {
      gainCumulatedFromEconomics = totalSavings25Years;
      // Estimate: subtract installation cost and approximate OPEX over 25 years
      const estimatedOpex25Years = annualOpex * 25;
      cashflowCumulated = totalSavings25Years - installationCost - estimatedOpex25Years;
    } else if (annualSavings > 0) {
      // Fallback: Estimate from annual savings (simple multiplication, no inflation)
      // This is a rough estimate - ideally the simulation should have proper economic analysis
      const estimatedTotalSavings = annualSavings * 25;
      gainCumulatedFromEconomics = estimatedTotalSavings;
      const estimatedOpex25Years = annualOpex * 25;
      cashflowCumulated = estimatedTotalSavings - installationCost - estimatedOpex25Years;
      Logger.warn('Using estimated values from annualSavings - simulation needs economic analysis for accurate values');
    }
    
    // For discounted values, we'd need the discount rate, but we can approximate
    // Using a simple discount factor (rough approximation at 8% discount rate)
    if (cashflowCumulated > 0) {
      // Rough approximation: discounted value is about 60-70% of non-discounted for 25 years at 8%
      cashflowDiscounted = cashflowCumulated * 0.65;
      gainDiscounted = gainCumulatedFromEconomics * 0.65;
    }
  }
  
  // Final fallback to gainCumulated (which is from totalSavings25Years or 0)
  gainCumulatedFromEconomics = gainCumulatedFromEconomics > 0 ? gainCumulatedFromEconomics : gainCumulated;
  
  // Calculate ROI now that we have the final gainCumulatedFromEconomics
  if (roi === 0 && gainCumulatedFromEconomics > 0 && installationCost > 0) {
    // ROI = (Total savings - Investment) / Investment * 100
    roi = ((gainCumulatedFromEconomics - installationCost) / installationCost) * 100;
  }
  
  // Calculate NPV if missing
  // NPV Formula: NPV = -CAPEX + Σ [NetGain(n) / (1+r)^n] for n=1 to 25
  // Where NetGain(n) = Savings(n) - OPEX(n)
  // 
  // In our fallback:
  // - cashflowCumulated = totalSavings - installationCost - totalOPEX (non-discounted)
  // - cashflowDiscounted = cashflowCumulated * 0.65 (rough discount approximation)
  //
  // But for proper NPV, we need:
  // NPV = -installationCost + sum of discounted (savings - OPEX)
  // Since cashflowDiscounted approximates the discounted net cash flows,
  // and cashflowCumulated already subtracts installationCost, we need to adjust:
  // NPV = cashflowDiscounted (if it represents discounted net flows)
  // OR: NPV = -installationCost + discountedNetFlows
  //
  // Actually, since cashflowDiscounted is based on cashflowCumulated which already
  // subtracts installationCost, we need to recalculate:
  // discountedNetFlows = (totalSavings - totalOPEX) * discountFactor
  // NPV = -installationCost + discountedNetFlows
  // Calculate NPV if missing
  // NPV Formula: NPV = -CAPEX + Σ [NetGain(n) / (1+r)^n] for n=1 to 25
  // Where NetGain(n) = Savings(n) - OPEX(n)
  let finalNpv = npv;
  if (npv === 0 && gainCumulatedFromEconomics > 0 && installationCost > 0) {
    const annualOpexValue = ensureNumber(solaireDto.annualOpex, 0);
    const totalOpex25Years = annualOpexValue * 25;
    
    // Calculate discounted net cash flows
    // Net cash flows = totalSavings - totalOPEX (before discounting)
    const netCashFlows = gainCumulatedFromEconomics - totalOpex25Years;
    
    // Apply discount factor (65% for 25 years at 8% discount rate)
    const discountedNetCashFlows = netCashFlows * 0.65;
    
    // NPV = -initial investment + discounted cash flows
    finalNpv = -installationCost + discountedNetCashFlows;
    
    Logger.warn(`Calculated NPV from fallback: ${finalNpv} DT`);
  }
  
  // Ensure all values are numbers (never null/undefined)
  const finalGainDiscounted = ensureNumber(gainDiscounted, 0);
  const finalCashflowCumulated = ensureNumber(cashflowCumulated, 0);
  const finalCashflowDiscounted = ensureNumber(cashflowDiscounted, 0);

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
    gainDiscounted: round(finalGainDiscounted, 0),
    cashflowCumulated: round(finalCashflowCumulated, 0),
    cashflowDiscounted: round(finalCashflowDiscounted, 0),
    npv: round(finalNpv, 0),
    paybackSimple: round(paybackSimple, 2),
    paybackDiscounted: round(paybackDiscounted, 2),
    irr: round(irr, 2),
    roi: round(roi, 2),

    co2PerYear: round(co2PerYear, 2),
    co2Total: round(co2Total, 0),
  };
}
