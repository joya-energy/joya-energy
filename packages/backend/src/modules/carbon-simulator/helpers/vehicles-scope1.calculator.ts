/**
 * Professional Vehicles Scope 1 Calculator (CO2_veh)
 *
 * Implements:
 * - E0 — Activation
 * - E1 — Kilométrage total annuel de la flotte
 * - E2 — Conversion kilomètres → litres de carburant
 * - E3 — Choix du facteur d’émission
 * - E4 — Calcul des émissions CO₂ (Scope 1)
 */

import {
  VEHICLE_CONSUMPTION_BY_USAGE,
  FUEL_EMISSION_FACTORS,
  VehicleUsageType,
  FuelType,
} from '@backend/domain/carbon';
import { Logger } from '@backend/middlewares';

/**
 * Input for vehicles Scope 1 calculation (CO2_veh)
 */
export interface VehiclesScope1Input {
  /**
   * Are there professional vehicles?
   * (E1 = Oui / Non)
   */
  hasVehicles: boolean;

  /**
   * Number of vehicles (N_veh)
   */
  numberOfVehicles: number;

  /**
   * Kilometers per vehicle per year (km_veh)
   */
  kmPerVehiclePerYear: number;

  /**
   * Main usage type (for consumption)
   */
  usageType: VehicleUsageType;

  /**
   * Fuel type
   */
  fuelType: FuelType;
}

/**
 * Result of vehicles Scope 1 calculation
 */
export interface VehiclesScope1Result {
  /**
   * Total annual kilometers (km_total)
   */
  totalAnnualKm: number;

  /**
   * Annual fuel consumption (L_an)
   */
  annualFuelLiters: number;

  /**
   * Emission factor (kgCO2e/L)
   */
  emissionFactorKgPerL: number;

  /**
   * CO₂ vehicles (kgCO2e/an)
   */
  co2VehiclesKg: number;

  /**
   * CO₂ vehicles (tCO2e/an)
   */
  co2VehiclesTonnes: number;
}

/**
 * Main function: calculate CO₂_veh (Scope 1)
 */
export function calculateVehiclesScope1(
  input: VehiclesScope1Input,
): VehiclesScope1Result {
  // E0 — Activation
  if (!input.hasVehicles || input.numberOfVehicles <= 0 || input.kmPerVehiclePerYear <= 0) {
    Logger.info('CO2_veh = 0 (no vehicles or zero distance)');
    return {
      totalAnnualKm: 0,
      annualFuelLiters: 0,
      emissionFactorKgPerL: 0,
      co2VehiclesKg: 0,
      co2VehiclesTonnes: 0,
    };
  }

  // E1 — Kilométrage total annuel de la flotte
  const totalAnnualKm =
    input.numberOfVehicles * input.kmPerVehiclePerYear;

  // E2 — Conversion kilomètres → litres de carburant
  const consumptionLPer100km =
    VEHICLE_CONSUMPTION_BY_USAGE[input.usageType];
  const annualFuelLiters =
    (totalAnnualKm * consumptionLPer100km) / 100;

  // E3 — Choix du facteur d’émission
  const emissionFactorKgPerL =
    FUEL_EMISSION_FACTORS[input.fuelType];

  // E4 — Calcul des émissions CO₂
  const co2VehiclesKg = Number(
    (annualFuelLiters * emissionFactorKgPerL).toFixed(2),
  );
  const co2VehiclesTonnes = Number(
    (co2VehiclesKg / 1000).toFixed(3),
  );

  Logger.info(
    `CO2_veh result: km_total=${totalAnnualKm}, L_an=${annualFuelLiters}, ` +
      `FE=${emissionFactorKgPerL} kgCO2e/L, CO2_veh=${co2VehiclesKg} kg (${co2VehiclesTonnes} t)`,
  );

  return {
    totalAnnualKm: Number(totalAnnualKm.toFixed(2)),
    annualFuelLiters: Number(annualFuelLiters.toFixed(2)),
    emissionFactorKgPerL,
    co2VehiclesKg,
    co2VehiclesTonnes,
  };
}

