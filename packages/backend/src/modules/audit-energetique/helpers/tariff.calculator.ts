import { EnergyTariffTypes } from '@shared/enums/audit-energy-tariff';
import { TARIFF_RATES } from '../config';

/**
 * Computes annual energy consumption from monthly bill amount
 * Formula: E_annuelle = (Facture_mensuelle / Tarif) × 12
 * 
 * @param monthlyBillAmount - Monthly bill in TND
 * @param tariffType - Tariff type (BT/MT/HT)
 * @returns Annual consumption in kWh
 */
export function computeAnnualConsumptionFromBill(
  monthlyBillAmount: number,
  tariffType: EnergyTariffTypes
): number {
  const rate = TARIFF_RATES[tariffType] ?? TARIFF_RATES[EnergyTariffTypes.BT];

  if (rate === 0) {
    return 0;
  }

  const monthlyConsumption = monthlyBillAmount / rate;
  return Number((monthlyConsumption * 12).toFixed(2));
}

/**
 * Computes energy intensity (kWh/m²/year)
 * Used for benchmarking and classification
 * 
 * @param annualConsumption - Annual consumption in kWh
 * @param surfaceArea - Surface area in m²
 * @returns Energy intensity in kWh/m²/year
 */
export function computeEnergyIntensity(
  annualConsumption: number,
  surfaceArea: number
): number {
  if (surfaceArea <= 0) {
    return 0;
  }

  return Number((annualConsumption / surfaceArea).toFixed(2));
}



