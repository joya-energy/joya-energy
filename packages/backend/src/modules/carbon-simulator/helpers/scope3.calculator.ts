/**
 * Scope 3 Total Calculator
 *
 * Total Scope 3:
 * CO2_Scope3 = CO2_travel + CO2_IT
 * tCO2_Scope3 = CO2_Scope3 / 1000
 *
 * Composes G. Déplacements professionnels and H. Équipements informatiques.
 */

import { calculateTravelScope3, type TravelScope3Input } from './travel-scope3.calculator';
import {
  calculateITEquipmentScope3,
  type ITEquipmentScope3Input,
} from './it-equipment-scope3.calculator';
import { Logger } from '@backend/middlewares';

/**
 * Input for total Scope 3
 */
export interface Scope3Input {
  travel: TravelScope3Input;
  itEquipment: ITEquipmentScope3Input;
}

/**
 * Result of total Scope 3 calculation
 */
export interface Scope3Result {
  /**
   * CO2_travel (kgCO2e/year)
   */
  co2TravelKg: number;

  /**
   * CO2_travel (tCO2e/year)
   */
  co2TravelTonnes: number;

  /**
   * CO2_IT (kgCO2e/year)
   */
  co2ITKg: number;

  /**
   * CO2_IT (tCO2e/year)
   */
  co2ITTonnes: number;

  /**
   * CO2_Scope3 = CO2_travel + CO2_IT (kgCO2e/year)
   */
  co2Scope3Kg: number;

  /**
   * tCO2_Scope3 = CO2_Scope3 / 1000
   */
  co2Scope3Tonnes: number;
}

/**
 * Compute total Scope 3: CO2_Scope3 = CO2_travel + CO2_IT, tCO2_Scope3 = CO2_Scope3 / 1000
 */
export function calculateScope3(input: Scope3Input): Scope3Result {
  const travelResult = calculateTravelScope3(input.travel);
  const itResult = calculateITEquipmentScope3(input.itEquipment);

  const co2Scope3Kg = Number(
    (travelResult.co2TravelKg + itResult.co2ITKg).toFixed(2),
  );
  const co2Scope3Tonnes = Number((co2Scope3Kg / 1000).toFixed(3));

  Logger.info(
    `Scope 3 total: CO2_travel=${travelResult.co2TravelKg} kg + CO2_IT=${itResult.co2ITKg} kg => CO2_Scope3=${co2Scope3Kg} kg (${co2Scope3Tonnes} t)`,
  );

  return {
    co2TravelKg: travelResult.co2TravelKg,
    co2TravelTonnes: travelResult.co2TravelTonnes,
    co2ITKg: itResult.co2ITKg,
    co2ITTonnes: itResult.co2ITTonnes,
    co2Scope3Kg,
    co2Scope3Tonnes,
  };
}
