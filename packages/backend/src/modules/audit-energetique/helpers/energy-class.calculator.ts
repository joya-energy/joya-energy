/**
 * Energy Class Calculator (Classement énergétique)
 * 
 * @description
 * Calculates BECTh (Besoins Énergétiques liés au Confort Thermique)
 * and assigns energy class according to Tunisia's building energy regulation
 * 
 * Only applicable to: Bureau / Administration / Banque
 * 
 * Formula:
 * BECTh = (BECh + BERef) / STC
 * 
 * Where:
 * - BECh: Annual heating needs (kWh/year)
 * - BERef: Annual cooling needs (kWh/year)
 * - STC: Total conditioned surface (m²)
 * - BECTh: Thermal comfort energy needs (kWh/m².year)
 */

import { BuildingTypes } from '@shared/enums/audit-general.enum';

export enum EnergyClass {
  CLASS_1 = 'Classe 1',
  CLASS_2 = 'Classe 2',
  CLASS_3 = 'Classe 3',
  CLASS_4 = 'Classe 4',
  CLASS_5 = 'Classe 5',
  CLASS_6 = 'Classe 6',
  CLASS_7 = 'Classe 7',
  CLASS_8 = 'Classe 8'
}

export interface EnergyClassInput {
  buildingType: BuildingTypes;
  heatingLoad: number; // kWh/year
  coolingLoad: number; // kWh/year
  conditionedSurface: number; // m²
}

export interface EnergyClassResult {
  becth: number | null; // kWh/m².year
  energyClass: EnergyClass | null;
  classDescription: string | null;
  isApplicable: boolean;
}

/**
 * Determines energy class based on BECTh value
 */
function getEnergyClass(becth: number): { class: EnergyClass; description: string } {
  if (becth <= 75) {
    return { class: EnergyClass.CLASS_1, description: 'Excellente performance' };
  }
  if (becth <= 85) {
    return { class: EnergyClass.CLASS_2, description: 'Très bonne performance' };
  }
  if (becth <= 95) {
    return { class: EnergyClass.CLASS_3, description: 'Bonne performance' };
  }
  if (becth <= 105) {
    return { class: EnergyClass.CLASS_4, description: 'Performance moyenne' };
  }
  if (becth <= 125) {
    return { class: EnergyClass.CLASS_5, description: 'Performance faible' };
  }
  if (becth <= 150) {
    return { class: EnergyClass.CLASS_6, description: 'Mauvaise performance' };
  }
  if (becth <= 180) {
    return { class: EnergyClass.CLASS_7, description: 'Très mauvaise performance' };
  }
  return { class: EnergyClass.CLASS_8, description: 'Performance critique' };
}

/**
 * Computes BECTh and energy class
 * 
 * Only applicable to Bureau / Administration / Banque buildings
 */
export function computeEnergyClass(input: EnergyClassInput): EnergyClassResult {
  // Energy classification only applies to offices
  const isOfficeBuilding = input.buildingType === BuildingTypes.OFFICE_ADMIN_BANK;

  if (!isOfficeBuilding) {
    return {
      becth: null,
      energyClass: null,
      classDescription: null,
      isApplicable: false
    };
  }

  // Check if conditioned surface is valid
  if (input.conditionedSurface <= 0) {
    return {
      becth: 0,
      energyClass: null,
      classDescription: 'Surface conditionnée invalide',
      isApplicable: true
    };
  }

  // Calculate BECTh
  const becth = (input.heatingLoad + input.coolingLoad) / input.conditionedSurface;
  const { class: energyClass, description } = getEnergyClass(becth);

  return {
    becth: Number(becth.toFixed(2)),
    energyClass,
    classDescription: description,
    isApplicable: true
  };
}

