/**
 * CO₂ Emissions Calculator
 * 
 * @description
 * Calculates annual CO₂ emissions from electricity and gas consumption
 * according to Tunisia's energy audit methodology
 * 
 * Emission factors (kg CO₂/kWh):
 * - Electricity (STEG grid): 0.000512 t CO₂/kWh = 0.512 kg CO₂/kWh
 * - Natural Gas: 0.000202 t CO₂/kWh = 0.202 kg CO₂/kWh
 */

export interface EmissionsInput {
  electricityConsumption: number; // kWh/year
  gasConsumption: number; // kWh/year
  emissionFactorElec?: number; // kg CO₂/kWh
  emissionFactorGas?: number; // kg CO₂/kWh
}

export interface EmissionsResult {
  co2FromElectricity: number; // kg CO₂/year
  co2FromGas: number; // kg CO₂/year
  totalCo2: number; // kg CO₂/year
  totalCo2Tons: number; // tons CO₂/year
}

/**
 * Computes annual CO₂ emissions from energy consumption
 * 
 * Formula:
 * - CO₂_elec = E_elec × 0.512 kg/kWh
 * - CO₂_gaz = E_gaz × 0.202 kg/kWh
 * - CO₂_total = CO₂_elec + CO₂_gaz
 */
export function computeCo2Emissions(input: EmissionsInput): EmissionsResult {
  const emissionFactorElec = input.emissionFactorElec ?? 0.512;
  const emissionFactorGas = input.emissionFactorGas ?? 0.202;

  const co2FromElectricity = input.electricityConsumption * emissionFactorElec;
  const co2FromGas = input.gasConsumption * emissionFactorGas;
  const totalCo2 = co2FromElectricity + co2FromGas;

  return {
    co2FromElectricity: Number(co2FromElectricity.toFixed(2)),
    co2FromGas: Number(co2FromGas.toFixed(2)),
    totalCo2: Number(totalCo2.toFixed(2)),
    totalCo2Tons: Number((totalCo2 / 1000).toFixed(3))
  };
}

