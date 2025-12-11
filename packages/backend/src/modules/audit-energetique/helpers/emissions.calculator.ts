/**
 * CO₂ Emissions Calculator
 * 
 * @description
 * Calculates annual CO₂ emissions from electricity and gas consumption
 * and assigns carbon classification according to Tunisia's carbon intensity thresholds
 * 
 * Emission factors (kg CO₂/kWh):
 * - Electricity (STEG grid): 0.512 kg CO₂/kWh
 * - Natural Gas: 0.202 kg CO₂/kWh
 */

import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade, EmissionUnit } from '@shared/enums/classification.enum';
import { computeCarbonClass } from './carbon-class.calculator';

const DEFAULT_EMISSION_FACTOR_ELEC = 0.512; // kg CO₂/kWh
const DEFAULT_EMISSION_FACTOR_GAS = 0.202; // kg CO₂/kWh

export interface EmissionsInput {
  electricityConsumption: number; // kWh/year
  gasConsumption: number; // kWh/year
  buildingType: BuildingTypes;
  conditionedSurface: number; // m²
  emissionFactorElec?: number; // kg CO₂/kWh
  emissionFactorGas?: number; // kg CO₂/kWh
}

export interface EmissionsResult {
  co2FromElectricity: number; // kg CO₂/year
  co2FromGas: number; // kg CO₂/year
  totalCo2: number; // kg CO₂/year
  totalCo2Tons: number; // tons CO₂/year
  carbonIntensity: number | null; // kg CO₂/m².year
  carbonIntensityUnit: EmissionUnit.KG_CO2_PER_M2_YEAR;
  carbonClass: ClassificationGrade | null;
  carbonDescription: string | null;
  isApplicable: boolean;
}

/**
 * Computes annual CO₂ emissions and carbon classification
 * 
 * Formulas:
 * - CO₂_elec = E_elec × 0.512 kg/kWh
 * - CO₂_gaz = E_gaz × 0.202 kg/kWh
 * - CO₂_total = CO₂_elec + CO₂_gaz
 * - CI (Carbon Intensity) = CO₂_total / Surface (kg CO₂/m².an)
 */
export function computeCo2Emissions(input: EmissionsInput): EmissionsResult {
  const emissionFactorElec = input.emissionFactorElec ?? DEFAULT_EMISSION_FACTOR_ELEC;
  const emissionFactorGas = input.emissionFactorGas ?? DEFAULT_EMISSION_FACTOR_GAS;

  const co2FromElectricity = input.electricityConsumption * emissionFactorElec;
  const co2FromGas = input.gasConsumption * emissionFactorGas;
  const totalCo2 = co2FromElectricity + co2FromGas;

  const carbonResult = computeCarbonClass({
    buildingType: input.buildingType,
    totalCo2Kg: totalCo2,
    conditionedSurface: input.conditionedSurface
  });

  return {
    co2FromElectricity: Number(co2FromElectricity.toFixed(2)),
    co2FromGas: Number(co2FromGas.toFixed(2)),
    totalCo2: Number(totalCo2.toFixed(2)),
    totalCo2Tons: Number((totalCo2 / 1000).toFixed(3)),
    carbonIntensity: carbonResult.intensity,
    carbonIntensityUnit: EmissionUnit.KG_CO2_PER_M2_YEAR,
    carbonClass: carbonResult.carbonClass,
    carbonDescription: carbonResult.classDescription,
    isApplicable: carbonResult.isApplicable
  };
}


