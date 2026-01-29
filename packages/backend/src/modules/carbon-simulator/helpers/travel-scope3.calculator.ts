/**
 * Professional Travel Scope 3 Calculator (CO2_travel)
 *
 * G. Déplacements professionnels (Scope 3)
 * CO2_travel = CO2_avion + CO2_train
 *
 * Uses PROFESSIONAL_TRAVEL_EMISSIONS by mode and frequency.
 */

import {
  PROFESSIONAL_TRAVEL_EMISSIONS,
  TravelMode,
  TravelFrequency,
} from '@backend/domain/carbon';
import { Logger } from '@backend/middlewares';

/**
 * Input for professional travel Scope 3 (CO2_travel)
 */
export interface TravelScope3Input {
  /**
   * Plane travel frequency (Avion). Omit or null = no plane emissions.
   */
  planeFrequency?: TravelFrequency | null;

  /**
   * Train travel frequency (Train). Omit or null = no train emissions.
   */
  trainFrequency?: TravelFrequency | null;
}

/**
 * Result of professional travel Scope 3 calculation
 */
export interface TravelScope3Result {
  /**
   * CO2 from plane (kgCO2e/year)
   */
  co2PlaneKg: number;

  /**
   * CO2 from train (kgCO2e/year)
   */
  co2TrainKg: number;

  /**
   * CO2_travel = CO2_avion + CO2_train (kgCO2e/year)
   */
  co2TravelKg: number;

  /**
   * CO2_travel in tonnes
   */
  co2TravelTonnes: number;
}

/**
 * Compute CO2_travel = CO2_avion + CO2_train (Scope 3)
 */
export function calculateTravelScope3(input: TravelScope3Input): TravelScope3Result {
  const co2PlaneKg =
    input.planeFrequency != null
      ? PROFESSIONAL_TRAVEL_EMISSIONS[TravelMode.PLANE][input.planeFrequency]
      : 0;
  const co2TrainKg =
    input.trainFrequency != null
      ? PROFESSIONAL_TRAVEL_EMISSIONS[TravelMode.TRAIN][input.trainFrequency]
      : 0;
  const co2TravelKg = Number((co2PlaneKg + co2TrainKg).toFixed(2));
  const co2TravelTonnes = Number((co2TravelKg / 1000).toFixed(3));

  Logger.info(
    `CO2_travel: CO2_avion=${co2PlaneKg} kg, CO2_train=${co2TrainKg} kg, ` +
      `CO2_travel=${co2TravelKg} kg (${co2TravelTonnes} t)`,
  );

  return {
    co2PlaneKg,
    co2TrainKg,
    co2TravelKg,
    co2TravelTonnes,
  };
}
