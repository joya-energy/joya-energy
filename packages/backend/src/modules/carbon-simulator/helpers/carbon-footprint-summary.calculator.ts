/**
 * Carbon Footprint Summary Calculator
 *
 * Aggregates all scopes into one result:
 * - Scope 1 = CO2_th + CO2_froid + CO2_veh (thermal + cold + vehicles)
 * - Scope 2 = CO2_elec (electricity)
 * - Scope 3 = CO2_travel + CO2_IT
 */

import {
  calculateElectricityCO2,
  type ElectricityCO2Input,
} from './electricity-co2.calculator';
import {
  calculateThermalScope1,
  type ThermalScope1Input,
} from './thermal-scope1.calculator';
import {
  calculateColdScope1,
  type ColdScope1Input,
} from './cold-scope1.calculator';
import {
  calculateVehiclesScope1,
  type VehiclesScope1Input,
} from './vehicles-scope1.calculator';
import { calculateScope3, type Scope3Input } from './scope3.calculator';
import { Logger } from '@backend/middlewares';

/**
 * Optional personal info for email notifications and marketing
 */
export interface PersonalInfo {
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
}

/**
 * Input for the full carbon footprint summary
 */
export interface CarbonFootprintSummaryInput {
  /**
   * Scope 2 — Electricity (CO2_elec)
   */
  electricity: ElectricityCO2Input;

  /**
   * Scope 1 — Thermal (CO2_th)
   */
  thermal: ThermalScope1Input;

  /**
   * Scope 1 — Cold (CO2_froid)
   */
  cold: ColdScope1Input;

  /**
   * Scope 1 — Vehicles (CO2_veh)
   */
  vehicles: VehiclesScope1Input;

  /**
   * Scope 3 — Travel + IT equipment
   */
  scope3: Scope3Input;

  /**
   * Optional personal info for email notifications
   */
  personal?: PersonalInfo;
}

/**
 * Result: all scopes summed
 */
export interface CarbonFootprintSummaryResult {
  /**
   * Scope 1 = CO2_th + CO2_froid + CO2_veh (kgCO2e/year)
   */
  co2Scope1Kg: number;

  /**
   * Scope 1 in tonnes
   */
  co2Scope1Tonnes: number;

  /**
   * Scope 2 = CO2_elec (kgCO2e/year)
   */
  co2Scope2Kg: number;

  /**
   * Scope 2 in tonnes
   */
  co2Scope2Tonnes: number;

  /**
   * Scope 3 = CO2_travel + CO2_IT (kgCO2e/year)
   */
  co2Scope3Kg: number;

  /**
   * Scope 3 in tonnes
   */
  co2Scope3Tonnes: number;

  /**
   * Total = Scope 1 + Scope 2 + Scope 3 (kgCO2e/year)
   */
  co2TotalKg: number;

  /**
   * Total in tonnes
   */
  co2TotalTonnes: number;
}

/**
 * Compute full carbon footprint summary: Scope 1 + Scope 2 + Scope 3
 */
export function calculateCarbonFootprintSummary(
  input: CarbonFootprintSummaryInput
): CarbonFootprintSummaryResult {
  // Scope 2 — Electricity (CO2_elec)
  const electricityResult = calculateElectricityCO2(input.electricity);
  const co2Scope2Kg = electricityResult.co2EmissionsKg;
  const co2Scope2Tonnes = Number((co2Scope2Kg / 1000).toFixed(3));

  // Scope 1 — Thermal uses annual electricity from Scope 2 result
  const thermalInput = {
    ...input.thermal,
    annualElectricityKwh: electricityResult.annualConsumptionKwh,
  };
  const thermalResult = calculateThermalScope1(thermalInput);
  const coldResult = calculateColdScope1(input.cold);
  const vehiclesResult = calculateVehiclesScope1(input.vehicles);
  const co2Scope1Kg = Number(
    (
      thermalResult.co2ThermalKg +
      coldResult.co2ColdKg +
      vehiclesResult.co2VehiclesKg
    ).toFixed(2)
  );
  const co2Scope1Tonnes = Number((co2Scope1Kg / 1000).toFixed(3));

  // Scope 3 — Travel + IT
  const scope3Result = calculateScope3(input.scope3);
  const co2Scope3Kg = scope3Result.co2Scope3Kg;
  const co2Scope3Tonnes = scope3Result.co2Scope3Tonnes;

  // Total
  const co2TotalKg = Number(
    (co2Scope1Kg + co2Scope2Kg + co2Scope3Kg).toFixed(2)
  );
  const co2TotalTonnes = Number((co2TotalKg / 1000).toFixed(3));

  Logger.info(
    `Carbon footprint summary: Scope1=${co2Scope1Kg} kg (${co2Scope1Tonnes} t), ` +
      `Scope2=CO2_elec=${co2Scope2Kg} kg (${co2Scope2Tonnes} t), ` +
      `Scope3=${co2Scope3Kg} kg (${co2Scope3Tonnes} t), ` +
      `Total=${co2TotalKg} kg (${co2TotalTonnes} t)`
  );

  return {
    co2Scope1Kg,
    co2Scope1Tonnes,
    co2Scope2Kg,
    co2Scope2Tonnes,
    co2Scope3Kg,
    co2Scope3Tonnes,
    co2TotalKg,
    co2TotalTonnes,
  };
}
