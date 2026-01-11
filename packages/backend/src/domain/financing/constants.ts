/**
 * Domain constants for financing comparison
 * These values represent JOYA's business rules and market conditions
 */

/**
 * Core financing constants
 * All solutions are compared over the same duration
 */
export const FINANCING_CONSTANTS = {
  DURATION_YEARS: 7,
  DURATION_MONTHS: 84,
  MONTHS_PER_YEAR: 12,
} as const;

/**
 * Self-financing rates by solution type
 */
export const SELF_FINANCING_RATES = {
  CASH: 1.0,
  CREDIT: 0.1,
  LEASING: 0.05,
  ESCO: 0.0,
} as const;

/**
 * Solar yield by location (kWh/kWp/year)
 * Based on Tunisian regional solar irradiation data
 */
export const LOCATION_YIELDS: Record<string, number> = {
  tunis: 1650,
  sousse: 1700,
  sfax: 1720,
  gabes: 1750,
  kairouan: 1680,
  bizerte: 1630,
  nabeul: 1660,
  monastir: 1700,
  mahdia: 1710,
  kasserine: 1690,
  sidi_bouzid: 1700,
  gafsa: 1730,
  tozeur: 1760,
  kebili: 1770,
  tataouine: 1750,
  medenine: 1740,
  default: 1680,
};

/**
 * Default project parameters
 */
export const DEFAULT_PROJECT_PARAMETERS = {
  costPerKwpDt: 2500,
  yieldKwhPerKwpYear: 1680,
  electricityPriceDtPerKwh: 0.18,
  opexRateAnnual: 0.015,
} as const;

/**
 * Default credit parameters
 */
export const DEFAULT_CREDIT_PARAMETERS = {
  creditAnnualRate: 0.09,
  selfFinancingRate: SELF_FINANCING_RATES.CREDIT,
} as const;

/**
 * Default leasing parameters
 */
export const DEFAULT_LEASING_PARAMETERS = {
  leasingAnnualRate: 0.12,
  leasingResidualValueRate: 0.10,
  leasingOpexMultiplier: 1.3,
  selfFinancingRate: SELF_FINANCING_RATES.LEASING,
} as const;

/**
 * Default ESCO parameters
 */
export const DEFAULT_ESCO_PARAMETERS = {
  escoTargetIrrAnnual: 0.16,
  escoOpexIncluded: true,
} as const;

