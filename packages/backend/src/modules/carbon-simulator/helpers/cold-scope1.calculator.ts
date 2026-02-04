/**
 * Cold / Air Conditioning Scope 1 Calculator (CO2_froid)
 *
 * Implements:
 * - D0 — Activation
 * - D1 — Nombre d’unités équivalent
 * - D2 — Charge totale de fluide
 * - D3 — Fuite annuelle estimée
 * - D4 — Conversion en CO₂ équivalent
 */

import {
  COLD_TYPE_BY_SECTOR,
  COLD_TYPE_PARAMETERS,
  ColdType,
  INTENSITY_COEFFICIENTS,
  AGE_COEFFICIENTS,
  MAINTENANCE_COEFFICIENTS,
} from '@backend/domain/carbon';
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { IntensityLevel, EquipmentAge, MaintenanceStatus } from '@backend/domain/carbon';
import { Logger } from '@backend/middlewares';

/**
 * Input for cold Scope 1 calculation (CO2_froid)
 */
export interface ColdScope1Input {
  /**
   * Is there any cold / refrigeration on site?
   * (froid présent ? Oui / Non)
   */
  hasCold: boolean;

  /**
   * Site surface (m²)
   */
  surfaceM2: number;

  /**
   * Sector / building type (used to deduce type_froid)
   */
  buildingType: BuildingTypes;

  /**
   * Intensity of use (C_int)
   */
  intensityLevel: IntensityLevel;

  /**
   * Age of equipment (C_age)
   */
  equipmentAge: EquipmentAge;

  /**
   * Maintenance quality (C_maint)
   */
  maintenanceStatus: MaintenanceStatus;
}

/**
 * Result of cold Scope 1 calculation
 */
export interface ColdScope1Result {
  /**
   * Deduced cold type (confort / commercial / mixte / industriel)
   */
  coldType: ColdType | null;

  /**
   * Equivalent number of units (N)
   */
  numberOfUnits: number;

  /**
   * Total refrigerant charge (kg)
   */
  totalChargeKg: number;

  /**
   * Annual leak (kg/an)
   */
  annualLeakKg: number;

  /**
   * CO₂ from refrigerant leaks (kgCO2e/an)
   */
  co2ColdKg: number;

  /**
   * CO₂ from refrigerant leaks (tCO2e/an)
   */
  co2ColdTonnes: number;
}

/**
 * Helper: deduce ColdType from building type
 * Throws if building type is unknown (no default).
 */
function deduceColdType(buildingType: BuildingTypes): ColdType {
  const key = buildingType as unknown as keyof typeof COLD_TYPE_BY_SECTOR;
  const value = COLD_TYPE_BY_SECTOR[key];
  if (value === undefined) {
    throw new Error(`Unknown building type for cold type: buildingType=${buildingType}`);
  }
  return value;
}

/**
 * Main function: calculate CO₂_froid (Scope 1)
 */
export function calculateColdScope1(input: ColdScope1Input): ColdScope1Result {
  // D0 — Activation
  if (!input.hasCold || input.surfaceM2 <= 0) {
    Logger.info('CO2_froid = 0 (no cold or zero surface)');
    return {
      coldType: null,
      numberOfUnits: 0,
      totalChargeKg: 0,
      annualLeakKg: 0,
      co2ColdKg: 0,
      co2ColdTonnes: 0,
    };
  }

  // Deduce cold type and parameters
  const coldType = deduceColdType(input.buildingType);
  const params = COLD_TYPE_PARAMETERS[coldType];

  // D1 — Nombre d’unités équivalent
  const numberOfUnits = Math.ceil(input.surfaceM2 / params.surfacePerUnitM2);

  // D2 — Charge totale de fluide
  const totalChargeKg = numberOfUnits * params.unitChargeKg;

  // D3 — Fuite annuelle estimée
  const baseLeakRate = params.annualLeakRate;
  const cInt = INTENSITY_COEFFICIENTS[input.intensityLevel];
  const cAge = AGE_COEFFICIENTS[input.equipmentAge];
  const cMaint = MAINTENANCE_COEFFICIENTS[input.maintenanceStatus];
  if (cInt === undefined) {
    throw new Error(`Unknown intensity level: intensityLevel=${input.intensityLevel}`);
  }
  if (cAge === undefined) {
    throw new Error(`Unknown equipment age: equipmentAge=${input.equipmentAge}`);
  }
  if (cMaint === undefined) {
    throw new Error(`Unknown maintenance status: maintenanceStatus=${input.maintenanceStatus}`);
  }

  const annualLeakKg = Number(
    (totalChargeKg * baseLeakRate * cInt * cAge * cMaint).toFixed(3),
  );

  // D4 — Conversion en CO₂ équivalent
  const co2ColdKg = Number((annualLeakKg * params.averageGwp).toFixed(2));
  const co2ColdTonnes = Number((co2ColdKg / 1000).toFixed(3));

  Logger.info(
    `CO2_froid result: type=${coldType}, N=${numberOfUnits}, charge_tot=${totalChargeKg} kg, ` +
      `fuite=${annualLeakKg} kg/an, CO2_froid=${co2ColdKg} kg (${co2ColdTonnes} t)`,
  );

  return {
    coldType,
    numberOfUnits,
    totalChargeKg: Number(totalChargeKg.toFixed(2)),
    annualLeakKg,
    co2ColdKg,
    co2ColdTonnes,
  };
}

