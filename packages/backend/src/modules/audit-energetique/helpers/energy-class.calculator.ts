/**
 * Energy Class Calculator (Classement énergétique)
 * 
 * @description
 * Calculates BECTh (Besoins Énergétiques liés au Confort Thermique)
 * and assigns energy class according to Tunisia's building energy regulation
 * 
 * Applicable to 5 building types:
 * 1. Bureaux / Administration / Banque
 * 2. Café / Restaurant / Centre esthétique / Spa
 * 3. Hôtel / Maison d'hôtes
 * 4. Clinique / Centre médical
 * 5. École / Centre de formation
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

import { Logger } from '@backend/middlewares';
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade, EnergyUnit } from '@shared/enums/classification.enum';

export interface EnergyClassInput {
  buildingType: BuildingTypes;
  electricityConsumption: number;
  gasConsumption: number;
  conditionedSurface: number;
  gasEfficiency?: number;
}

export interface EnergyClassResult {
  totalAnnualEnergy: number;
  siteIntensity: number;
  referenceIntensity: number | null;
  joyaIndex: number | null;
  joyaClass: ClassificationGrade;
  classDescription: string;
  isApplicable: boolean;
  unit: EnergyUnit.KWH_PER_M2_YEAR;
  becth: number;
}

type Threshold = { max: number; class: ClassificationGrade; description: string };

const JOYA_THRESHOLDS: Threshold[] = [
  { max: 0.6, class: ClassificationGrade.A, description: 'Optimisé' },
  { max: 0.85, class: ClassificationGrade.B, description: 'Efficace' },
  { max: 1.15, class: ClassificationGrade.C, description: 'Standard' },
  { max: 1.4, class: ClassificationGrade.D, description: 'Surconsommation' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très énergivore' }
];

const REFERENCE_INTENSITIES: Record<BuildingTypes, number> = {
  [BuildingTypes.SERVICE]: 138,
  [BuildingTypes.CAFE_RESTAURANT]: 180,
  [BuildingTypes.BEAUTY_CENTER]: 140,
  [BuildingTypes.OFFICE_ADMIN_BANK]: 110,
  [BuildingTypes.CLINIC_MEDICAL]: 220,
  [BuildingTypes.HOTEL_GUESTHOUSE]: 200,
  [BuildingTypes.SCHOOL_TRAINING]: 90,
  [BuildingTypes.LIGHT_WORKSHOP]: 130,
  [BuildingTypes.HEAVY_FACTORY]: 180,
  [BuildingTypes.TEXTILE_PACKAGING]: 160,
  [BuildingTypes.FOOD_INDUSTRY]: 190,
  [BuildingTypes.PLASTIC_INJECTION]: 170,
  [BuildingTypes.COLD_AGRO_INDUSTRY]: 240
};

function classifyIndex(index: number): { class: ClassificationGrade; description: string } {
  for (const threshold of JOYA_THRESHOLDS) {
    if (index <= threshold.max) {
      return { class: threshold.class, description: threshold.description };
    }
  }
  const finalThreshold = JOYA_THRESHOLDS[JOYA_THRESHOLDS.length - 1];
  return { class: finalThreshold.class, description: finalThreshold.description };
}

export function computeEnergyClass(input: EnergyClassInput): EnergyClassResult {
  if (input.conditionedSurface <= 0) {
    return {
      totalAnnualEnergy: 0,
      siteIntensity: 0,
      referenceIntensity: null,
      joyaIndex: null,
      joyaClass: ClassificationGrade.NOT_APPLICABLE,
      classDescription: 'Surface conditionnée invalide',
      isApplicable: false,
      unit: EnergyUnit.KWH_PER_M2_YEAR,
      becth: 0
    };
  }

  const referenceIntensity = REFERENCE_INTENSITIES[input.buildingType] ?? null;
  if (!referenceIntensity) {
    return {
      totalAnnualEnergy: 0,
      siteIntensity: 0,
      referenceIntensity: null,
      joyaIndex: null,
      joyaClass: ClassificationGrade.NOT_APPLICABLE,
      classDescription: 'Classement énergétique non disponible pour ce type de bâtiment',
      isApplicable: false,
      unit: EnergyUnit.KWH_PER_M2_YEAR,
      becth: 0
    };
  }

//  const gasEfficiency = input.gasEfficiency ?? DEFAULT_GAS_EFFICIENCY;
//  const usefulGasEnergy = input.gasConsumption / gasEfficiency;
//  const totalAnnualEnergy = input.electricityConsumption + usefulGasEnergy;
  const totalAnnualEnergy = input.electricityConsumption + input.gasConsumption;
  const siteIntensity = totalAnnualEnergy / input.conditionedSurface;
  const joyaIndex = siteIntensity / referenceIntensity;

  Logger.info(`Total annual energy: ${totalAnnualEnergy} kWh`);
  Logger.info(`Site intensity: ${siteIntensity} kWh/m².an`);
  Logger.info(`Reference intensity: ${referenceIntensity} kWh/m².an`);

  const { class: joyaClass, description } = classifyIndex(joyaIndex);

  return {
    totalAnnualEnergy: Number(totalAnnualEnergy.toFixed(2)),
    siteIntensity: Number(siteIntensity.toFixed(2)),
    referenceIntensity,
    joyaIndex: Number(joyaIndex.toFixed(2)),
    joyaClass,
    classDescription: description,
    isApplicable: true,
    unit: EnergyUnit.KWH_PER_M2_YEAR,
    becth: Number(siteIntensity.toFixed(2))
  };
}

