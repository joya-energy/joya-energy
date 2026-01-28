/**
 * Carbon Simulator Service
 * Main service for carbon footprint simulation
 *
 * This service orchestrates carbon footprint calculations.
 * For now it exposes Étape B3 — CO₂ électricité.
 */

import {
  calculateElectricityCO2,
  type ElectricityCO2Input,
  type ElectricityCO2Result,
} from './helpers/electricity-co2.calculator';
import { Logger } from '@backend/middlewares';

export class CarbonSimulatorService {
  /**
   * Proxy around calculateElectricityCO2 with logging.
   */
  async calculateElectricityCO2(input: ElectricityCO2Input): Promise<ElectricityCO2Result> {
    Logger.info('Calculating electricity CO₂ emissions (input)', {
      tariffType: input.tariffType,
      monthlyAmountDt: input.monthlyAmountDt,
      referenceMonth: input.referenceMonth,
      buildingType: input.buildingType,
      climateZone: input.climateZone,
    });

    const result = calculateElectricityCO2(input);

    Logger.info('Electricity CO₂ emissions (result)', {
      monthlyConsumptionKwh: result.monthlyConsumptionKwh,
      annualConsumptionKwh: result.annualConsumptionKwh,
      co2EmissionsKg: result.co2EmissionsKg,
      appliedRateDtPerKwh: result.appliedRateDtPerKwh,
    });

    return result;
  }
}

// Export singleton instance
export const carbonSimulatorService = new CarbonSimulatorService();
