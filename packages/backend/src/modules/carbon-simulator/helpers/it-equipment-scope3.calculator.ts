/**
 * IT Equipment Scope 3 Calculator (CO2_IT)
 *
 * H. Équipements informatiques (Scope 3)
 * CO2_IT = 120×Ordinateur portable + 200×Ordinateur fixe + 80×Écran + 50×Téléphone pro
 *
 * Uses IT_EQUIPMENT_EMISSIONS (kgCO2e/unit/year).
 */

import { IT_EQUIPMENT_EMISSIONS, ITEquipmentType } from '@backend/domain/carbon';
import { Logger } from '@backend/middlewares';

/**
 * Input for IT equipment Scope 3 (CO2_IT)
 */
export interface ITEquipmentScope3Input {
  /**
   * Number of laptops (Ordinateur portable) — 120 kgCO2e/unit/year
   */
  laptopCount: number;

  /**
   * Number of desktops (Ordinateur fixe) — 200 kgCO2e/unit/year
   */
  desktopCount: number;

  /**
   * Number of screens (Écran) — 80 kgCO2e/unit/year
   */
  screenCount: number;

  /**
   * Number of professional phones (Téléphone pro) — 50 kgCO2e/unit/year
   */
  proPhoneCount: number;
}

/**
 * Result of IT equipment Scope 3 calculation
 */
export interface ITEquipmentScope3Result {
  /**
   * CO2_IT (kgCO2e/year)
   */
  co2ITKg: number;

  /**
   * CO2_IT in tonnes
   */
  co2ITTonnes: number;
}

/**
 * Compute CO2_IT = 120×Laptop + 200×Desktop + 80×Screen + 50×Pro phone (Scope 3)
 */
export function calculateITEquipmentScope3(
  input: ITEquipmentScope3Input,
): ITEquipmentScope3Result {
  const laptopKg = Math.max(0, input.laptopCount) * IT_EQUIPMENT_EMISSIONS[ITEquipmentType.LAPTOP];
  const desktopKg = Math.max(0, input.desktopCount) * IT_EQUIPMENT_EMISSIONS[ITEquipmentType.DESKTOP];
  const screenKg = Math.max(0, input.screenCount) * IT_EQUIPMENT_EMISSIONS[ITEquipmentType.SCREEN];
  const proPhoneKg =
    Math.max(0, input.proPhoneCount) * IT_EQUIPMENT_EMISSIONS[ITEquipmentType.PRO_PHONE];

  const co2ITKg = Number(
    (laptopKg + desktopKg + screenKg + proPhoneKg).toFixed(2),
  );
  const co2ITTonnes = Number((co2ITKg / 1000).toFixed(3));

  Logger.info(
    `CO2_IT: ${input.laptopCount}×120 + ${input.desktopCount}×200 + ${input.screenCount}×80 + ${input.proPhoneCount}×50 = ${co2ITKg} kg (${co2ITTonnes} t)`,
  );

  return {
    co2ITKg,
    co2ITTonnes,
  };
}
