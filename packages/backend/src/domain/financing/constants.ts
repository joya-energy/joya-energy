/**
 * Domain constants for financing comparison
 * These values represent JOYA's business rules and market conditions
 */

import { Governorates } from '@shared/enums/audit-general.enum';

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
 * Get solar yield by governorate (kWh/kWp/year)
 * Fetches data dynamically from PVGIS API
 * Falls back to default values if API is unavailable
 */
export async function getLocationYields(): Promise<Record<Governorates, number>> {
  try {
    const { locationService } = await import('@backend/modules/financing-comparison/services');
    return await locationService.getAllGovernorateYields();
  } catch (error) {
    console.warn('Failed to fetch dynamic yields from PVGIS, using fallback values', error);

    // Fallback to static values if PVGIS API fails - map to enum values
    return {
      [Governorates.TUNIS]: 1650,
      [Governorates.ARIANA]: 1640,
      [Governorates.BEN_AROUS]: 1645,
      [Governorates.MANOUBA]: 1640,
      [Governorates.BIZERTE]: 1630,
      [Governorates.BEJA]: 1620,
      [Governorates.JENDOUBA]: 1610,
      [Governorates.KAIROUAN]: 1680,
      [Governorates.KASSERINE]: 1690,
      [Governorates.MEDENINE]: 1740,
      [Governorates.MONASTIR]: 1700,
      [Governorates.NABEUL]: 1660,
      [Governorates.SFAX]: 1720,
      [Governorates.SOUSSE]: 1700,
      [Governorates.TATAOUINE]: 1750,
      [Governorates.TOZEUR]: 1760,
      [Governorates.ZAGHOUAN]: 1635,
      [Governorates.SILIANA]: 1625,
      [Governorates.KEF]: 1615,
      [Governorates.MAHDIA]: 1710,
      [Governorates.SIDI_BOU_ZID]: 1700,
      [Governorates.GABES]: 1750,
      [Governorates.GAFSA]: 1730,
    };
  }
}

/**
 * Legacy static LOCATION_YIELDS for backward compatibility
 * @deprecated Use getLocationYields() instead
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

