/**
 * Electricity CO₂ Calculator
 * Étape B3 — CO₂ électricité
 *
 * Uses:
 * - STEG tariffs (BT / MT)
 * - Existing consumption extrapolation from audit-solaire
 * - Electricity emission factor from carbon domain
 */

import {
  CARBON_EMISSION_FACTORS,
  STEG_MT_TARIFFS,
  DEFAULT_AVERAGE_ELECTRICITY_PRICE_DT_PER_KWH,
} from '@backend/domain/carbon';
import { extrapolateConsumption } from '@backend/modules/audit-solaire/helpers/consumption-extrapolation.calculator';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';
import { Logger } from '@backend/middlewares';

/**
 * Electricity tariff type
 */
export type ElectricityTariffType = 'BT' | 'MT_UNIFORME' | 'MT_HORAIRE';

/**
 * Input for electricity CO₂ calculation
 */
export interface ElectricityCO2Input {
  /**
   * Monthly electricity bill amount in DT
   */
  monthlyAmountDt: number;

  /**
   * Reference month (1-12) for the measured bill
   */
  referenceMonth: number;

  /**
   * Building type for extrapolation
   */
  buildingType: BuildingTypes;

  /**
   * Climate zone for extrapolation
   */
  climateZone: ClimateZones;

  /**
   * Electricity tariff type (BT, MT_UNIFORME, or MT_HORAIRE)
   */
  tariffType: ElectricityTariffType;
}

/**
 * Result of electricity CO₂ calculation
 */
export interface ElectricityCO2Result {
  /**
   * Monthly consumption in kWh (from bill amount conversion)
   */
  monthlyConsumptionKwh: number;

  /**
   * Annual consumption in kWh (from extrapolation)
   */
  annualConsumptionKwh: number;

  /**
   * CO₂ emissions from electricity (kg CO₂e)
   * Formula: CO2_elec = kWh_an × FE_elec
   */
  co2EmissionsKg: number;

  /**
   * Applied tariff rate (DT/kWh)
   */
  appliedRateDtPerKwh: number;
}

/**
 * Convert monthly bill amount to consumption using uniform tariff
 *
 * For BT: Uses average electricity price (0.391 DT/kWh)
 * For MT: Uses the specified MT tariff (UNIFORME or HORAIRE)
 *
 * @param monthlyAmountDt - Monthly bill amount in DT
 * @param tariffType - Electricity tariff type
 * @returns Monthly consumption in kWh and applied rate
 */
function convertAmountToConsumption(
  monthlyAmountDt: number,
  tariffType: ElectricityTariffType,
): { monthlyConsumptionKwh: number; appliedRate: number } {
  if (monthlyAmountDt <= 0) {
    return { monthlyConsumptionKwh: 0, appliedRate: 0 };
  }

  let rate: number;

  if (tariffType === 'BT') {
    // Use average electricity price for BT (uniform rate)
    rate = DEFAULT_AVERAGE_ELECTRICITY_PRICE_DT_PER_KWH;
  } else if (tariffType === 'MT_UNIFORME') {
    rate = STEG_MT_TARIFFS.UNIFORME.rateDtPerKwh;
  } else {
    // MT_HORAIRE
    rate = STEG_MT_TARIFFS.HORAIRE.rateDtPerKwh;
  }

  const monthlyConsumptionKwh = monthlyAmountDt / rate;

  return {
    monthlyConsumptionKwh: Number(monthlyConsumptionKwh.toFixed(2)),
    appliedRate: rate,
  };
}

/**
 * Étape B3 — CO₂ électricité
 * Calculate CO₂ emissions from electricity consumption
 *
 * Formula: CO2_elec = kWh_an × FE_elec
 *
 * Process:
 * 1. Convert monthly bill amount (DT) → monthly consumption (kWh) based on tariff type
 * 2. Extrapolate monthly consumption → annual consumption using building type and climate zone
 * 3. Calculate CO₂ emissions: annual consumption × emission factor
 *
 * @param input - Input parameters for electricity CO₂ calculation
 * @returns Electricity CO₂ calculation result
 */
export function calculateElectricityCO2(input: ElectricityCO2Input): ElectricityCO2Result {
  // Step 1: Convert monthly bill amount to monthly consumption (kWh)
  const { monthlyConsumptionKwh, appliedRate } = convertAmountToConsumption(
    input.monthlyAmountDt,
    input.tariffType,
  );

  // Step 2: Extrapolate monthly consumption to annual consumption
  const extrapolationResult = extrapolateConsumption({
    measuredConsumption: monthlyConsumptionKwh,
    referenceMonth: input.referenceMonth,
    buildingType: input.buildingType,
    climateZone: input.climateZone,
  });

  const annualConsumptionKwh = extrapolationResult.annualEstimatedConsumption;

  // Step 3: Calculate CO₂ emissions
  // CO2_elec = kWh_an × FE_elec
  const co2EmissionsKg = annualConsumptionKwh * CARBON_EMISSION_FACTORS.ELECTRICITY;

  const result: ElectricityCO2Result = {
    monthlyConsumptionKwh,
    annualConsumptionKwh,
    co2EmissionsKg: Number(co2EmissionsKg.toFixed(2)),
    appliedRateDtPerKwh: appliedRate,
  };

  // Log only CO2_elec result (kgCO2e/an)
  Logger.info(`CO2_elec = ${result.co2EmissionsKg} kgCO2e/an`);

  return result;
}

