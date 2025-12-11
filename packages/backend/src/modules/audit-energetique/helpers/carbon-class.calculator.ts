import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade, EmissionUnit } from '@shared/enums/classification.enum';

export interface CarbonClassInput {
  buildingType: BuildingTypes;
  totalCo2Kg: number; // kg CO₂/year (already computed)
  conditionedSurface: number; // m² (SHAB)
}

export interface CarbonClassResult {
  intensity: number | null; // kg CO₂/m².an
  unit: EmissionUnit.KG_CO2_PER_M2_YEAR;
  carbonClass: ClassificationGrade | null;
  classDescription: string | null;
  isApplicable: boolean;
}

type CarbonThreshold = { max: number; class: ClassificationGrade; description: string };

const GENERAL_THRESHOLDS: CarbonThreshold[] = [
  { max: 15, class: ClassificationGrade.A, description: 'Très faible empreinte carbone' },
  { max: 25, class: ClassificationGrade.B, description: 'Bonne performance' },
  { max: 40, class: ClassificationGrade.C, description: 'Niveau moyen' },
  { max: 60, class: ClassificationGrade.D, description: 'Émissions élevées' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très émissif' }
];

const CAFE_THRESHOLDS: CarbonThreshold[] = [
  { max: 20, class: ClassificationGrade.A, description: 'Très faible empreinte carbone' },
  { max: 30, class: ClassificationGrade.B, description: 'Bonne performance' },
  { max: 50, class: ClassificationGrade.C, description: 'Niveau moyen' },
  { max: 75, class: ClassificationGrade.D, description: 'Émissions élevées' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très émissif' }
];

const HOTEL_THRESHOLDS: CarbonThreshold[] = [
  { max: 18, class: ClassificationGrade.A, description: 'Très faible empreinte carbone' },
  { max: 30, class: ClassificationGrade.B, description: 'Bonne performance' },
  { max: 50, class: ClassificationGrade.C, description: 'Niveau moyen' },
  { max: 70, class: ClassificationGrade.D, description: 'Émissions élevées' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très émissif' }
];

const CLINIC_THRESHOLDS: CarbonThreshold[] = [
  { max: 20, class: ClassificationGrade.A, description: 'Très faible empreinte carbone' },
  { max: 35, class: ClassificationGrade.B, description: 'Bonne performance' },
  { max: 55, class: ClassificationGrade.C, description: 'Niveau moyen' },
  { max: 80, class: ClassificationGrade.D, description: 'Émissions élevées' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très émissif' }
];

const SCHOOL_THRESHOLDS: CarbonThreshold[] = [
  { max: 12, class: ClassificationGrade.A, description: 'Très faible empreinte carbone' },
  { max: 20, class: ClassificationGrade.B, description: 'Bonne performance' },
  { max: 30, class: ClassificationGrade.C, description: 'Niveau moyen' },
  { max: 45, class: ClassificationGrade.D, description: 'Émissions élevées' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très émissif' }
];

function getThresholds(buildingType: BuildingTypes): CarbonThreshold[] | null {
  switch (buildingType) {
    case BuildingTypes.OFFICE_ADMIN_BANK:
    case BuildingTypes.PHARMACY:
      return GENERAL_THRESHOLDS;
    case BuildingTypes.CAFE_RESTAURANT:
    case BuildingTypes.BEAUTY_CENTER:
      return CAFE_THRESHOLDS;
    case BuildingTypes.HOTEL_GUESTHOUSE:
      return HOTEL_THRESHOLDS;
    case BuildingTypes.CLINIC_MEDICAL:
      return CLINIC_THRESHOLDS;
    case BuildingTypes.SCHOOL_TRAINING:
      return SCHOOL_THRESHOLDS;
    default:
      return null;
  }
}

function classify(
  intensity: number,
  thresholds: CarbonThreshold[]
): { class: ClassificationGrade; description: string } {
  for (const threshold of thresholds) {
    if (intensity <= threshold.max) {
      return { class: threshold.class, description: threshold.description };
    }
  }
  return {
    class: thresholds[thresholds.length - 1].class,
    description: thresholds[thresholds.length - 1].description
  };
}

/**
 * Classifies a building's carbon intensity into grades A-E
 * 
 * @param input - Contains total CO₂ emissions (already computed), building type, and conditioned surface
 * @returns Carbon intensity (kg CO₂/m².an) and classification grade
 */
export function computeCarbonClass(input: CarbonClassInput): CarbonClassResult {
  const thresholds = getThresholds(input.buildingType);

  if (!thresholds) {
    return {
      intensity: null,
      unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
      carbonClass: ClassificationGrade.NOT_APPLICABLE,
      classDescription: 'Type de bâtiment non supporté pour le classement carbone',
      isApplicable: false
    };
  }

  if (input.conditionedSurface <= 0) {
    return {
      intensity: null,
      unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
      carbonClass: ClassificationGrade.NOT_APPLICABLE,
      classDescription: 'Surface conditionnée invalide',
      isApplicable: false
    };
  }

  const intensity = input.totalCo2Kg / input.conditionedSurface;
  const { class: carbonClass, description: classDescription } = classify(intensity, thresholds);

  return {
    intensity: Number(intensity.toFixed(2)),
    unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
    carbonClass,
    classDescription,
    isApplicable: true
  };
}

