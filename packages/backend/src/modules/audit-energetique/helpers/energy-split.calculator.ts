/**
 * Energy Split Calculator
 * 
 * @description
 * Separates total energy consumption into electricity and gas components
 * based on heating and ECS system types
 */

import { HeatingSystemTypes, DomesticHotWaterTypes } from '@shared/enums/audit-batiment.enum';

export interface EnergySplitInput {
  totalConsumption: number; // kWh/year
  heatingSystem: HeatingSystemTypes;
  ecsType: DomesticHotWaterTypes;
  heatingLoadKwh: number; // Annual heating load (kWh)
  ecsLoadKwh: number; // Annual ECS load (kWh)
}

export interface EnergySplitResult {
  electricityConsumption: number; // kWh/year
  gasConsumption: number; // kWh/year
}

/**
 * Splits energy consumption between electricity and gas
 * 
 * Logic:
 * - Gas consumption comes from:
 *   - Gas boiler heating
 *   - Gas ECS
 * - Everything else is electricity
 */
export function computeEnergySplit(input: EnergySplitInput): EnergySplitResult {
  let gasConsumption = 0;

  // Add gas from heating system
  if (input.heatingSystem === HeatingSystemTypes.GAS_BOILER) {
    gasConsumption += input.heatingLoadKwh ;
  }

  // Add gas from ECS
  if (input.ecsType === DomesticHotWaterTypes.GAS) {
    gasConsumption += input.ecsLoadKwh;
  }

  // Remaining consumption is electricity
  const electricityConsumption = Math.max(0, input.totalConsumption - gasConsumption);

  return {
    electricityConsumption: Number(electricityConsumption.toFixed(2)),
    gasConsumption: Number(gasConsumption.toFixed(2))
  };
}

