/**
 * CO₂ Emission Factors Configuration
 * 
 * @description
 * Emission factors for different energy sources in Tunisia
 * Values in kg CO₂ per kWh
 * 
 * Sources:
 * - STEG (electricity grid): 0.512 kg CO₂/kWh
 * - Natural gas: 0.202 kg CO₂/kWh
 */

export const EMISSION_FACTORS = {
  ELECTRICITY: 0.512, // kg CO₂/kWh (STEG grid)
  NATURAL_GAS: 0.202, // kg CO₂/kWh
  SOLAR_PV: 0, // kg CO₂/kWh (renewable)
  SOLAR_THERMAL: 0 // kg CO₂/kWh (renewable)
} as const;

export type EmissionFactorType = keyof typeof EMISSION_FACTORS;

