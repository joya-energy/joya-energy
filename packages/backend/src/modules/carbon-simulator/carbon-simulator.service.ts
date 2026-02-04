/**
 * Carbon Simulator Service
 * Main service for carbon footprint simulation
 *
 * This service orchestrates carbon footprint calculations:
 * Scope 2 (électricité), Scope 1 (chaleur, froid, véhicules), Scope 3 (déplacements pro, IT).
 */

import {
  calculateElectricityCO2,
  type ElectricityCO2Input,
  type ElectricityCO2Result,
} from './helpers/electricity-co2.calculator';
import {
  calculateScope3 as computeScope3Total,
  type Scope3Input,
  type Scope3Result,
} from './helpers/scope3.calculator';
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

  /**
   * Scope 3: CO2_Scope3 = CO2_travel + CO2_IT, tCO2_Scope3 = CO2_Scope3 / 1000
   */
  async calculateScope3(input: Scope3Input): Promise<Scope3Result> {
    Logger.info('Calculating Scope 3 emissions (input)', {
      travel: input.travel,
      itEquipment: input.itEquipment,
    });

    const result = computeScope3Total(input);

    Logger.info('Scope 3 emissions (result)', {
      co2TravelKg: result.co2TravelKg,
      co2ITKg: result.co2ITKg,
      co2Scope3Kg: result.co2Scope3Kg,
      co2Scope3Tonnes: result.co2Scope3Tonnes,
    });

    return result;
  }
}

// Export singleton instance
export const carbonSimulatorService = new CarbonSimulatorService();
