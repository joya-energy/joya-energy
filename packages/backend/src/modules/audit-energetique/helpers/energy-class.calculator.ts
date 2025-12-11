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
  heatingLoad: number; // kWh/year
  heatingLoadClass: number; // kWh/year
  coolingLoad: number; // kWh/year
  coolingLoadClass: number; // kWh/year
  conditionedSurface: number; //  :todo: to be removed
}

export interface EnergyClassResult {
  becth: number | null; // kWh/m².year
  energyClass: ClassificationGrade | null;
  classDescription: string | null;
  isApplicable: boolean;
  unit: EnergyUnit.KWH_PER_M2_YEAR;
}

type Threshold = { max: number; class: ClassificationGrade; description: string };

const OFFICE_THRESHOLDS: Threshold[] = [
  { max: 60, class: ClassificationGrade.A, description: 'Très bon niveau énergétique (bâtiment récent / clim performante)' },
  { max: 90, class: ClassificationGrade.B, description: 'Bon confort et bonne enveloppe' },
  { max: 120, class: ClassificationGrade.C, description: 'Niveau courant en Tunisie' },
  { max: 160, class: ClassificationGrade.D, description: 'Isolation faible, clim ancienne' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Bâtiment énergivore' }
];

const CAFE_THRESHOLDS: Threshold[] = [
  { max: 80, class: ClassificationGrade.A, description: 'Rare, clim performante et bien dimensionnée' },
  { max: 120, class: ClassificationGrade.B, description: 'Niveau correct' },
  { max: 160, class: ClassificationGrade.C, description: 'Niveau courant Tunisie (fort usage clim)' },
  { max: 200, class: ClassificationGrade.D, description: 'Climatisation insuffisante, pertes' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très énergivore' }
];

const HOTEL_THRESHOLDS: Threshold[] = [
  { max: 90, class: ClassificationGrade.A, description: 'Hôtel moderne / bonne enveloppe' },
  { max: 130, class: ClassificationGrade.B, description: 'Acceptable en Tunisie' },
  { max: 170, class: ClassificationGrade.C, description: 'Niveau courant pour hôtels 3★' },
  { max: 220, class: ClassificationGrade.D, description: 'Forte clim, isolation faible' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très énergivore' }
];

const CLINIC_THRESHOLDS: Threshold[] = [
  { max: 110, class: ClassificationGrade.A, description: 'Très bon niveau, bâtiment performant (rare en Tunisie)'},
  { max: 150, class: ClassificationGrade.B, description: 'Bon niveau , clim et enveloppe maitrisées' },
  { max: 200, class: ClassificationGrade.C, description: 'Niveau courant en Tunisie pour les cliniques' },
  { max: 250, class: ClassificationGrade.D, description: 'Consommation élevée (HVAC continu)' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très énergivore (forte clim + équipements médicaux)' }
];

const SCHOOL_THRESHOLDS: Threshold[] = [
  { max: 70, class: ClassificationGrade.A, description: 'Très performant' },
  { max: 100, class: ClassificationGrade.B, description: 'Bon niveau' },
  { max: 130, class: ClassificationGrade.C, description: 'Niveau courant Tunisie' },
  { max: 180, class: ClassificationGrade.D, description: 'Confort faible, clim limitée' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très énergivore' }
];

const PHARMACY_THRESHOLDS: Threshold[] = [
  { max: 75, class: ClassificationGrade.A, description: 'Très performant' },
  { max: 105, class: ClassificationGrade.B, description: 'Bon niveau' },
  { max: 135, class: ClassificationGrade.C, description: 'Niveau courant Tunisie' },
  { max: 170, class: ClassificationGrade.D, description: 'Confort faible, clim limitée' },
  { max: Number.POSITIVE_INFINITY, class: ClassificationGrade.E, description: 'Très énergivore' }
];
function getThresholds(buildingType: BuildingTypes): Threshold[] | null {
  switch (buildingType) {
    case BuildingTypes.OFFICE_ADMIN_BANK:
      return OFFICE_THRESHOLDS;
    case BuildingTypes.CAFE_RESTAURANT:
    case BuildingTypes.BEAUTY_CENTER:
      return CAFE_THRESHOLDS;
    case BuildingTypes.HOTEL_GUESTHOUSE:
      return HOTEL_THRESHOLDS;
    case BuildingTypes.CLINIC_MEDICAL:
      return CLINIC_THRESHOLDS;
    case BuildingTypes.SCHOOL_TRAINING:
      return SCHOOL_THRESHOLDS;
    case BuildingTypes.PHARMACY:
      return PHARMACY_THRESHOLDS;
    default:
      return null;
  }
}

function classify(becth: number, thresholds: Threshold[]): { class: ClassificationGrade; description: string } {
  for (const threshold of thresholds) {
    if (becth <= threshold.max) {
      return { class: threshold.class, description: threshold.description };
    }
  }
  // Fallback (should never hit because Infinity is last)
  return { class: thresholds[thresholds.length - 1].class, description: thresholds[thresholds.length - 1].description };
}

/**
 * Computes BECTh and energy class
 * 
 * Returns classification for supported building types (Offices, Cafés, Hotels, Clinics, Schools)
 * Returns NOT_APPLICABLE for other building types (Pharmacies, Factories, etc.)
 */
export function computeEnergyClass(input: EnergyClassInput): EnergyClassResult {
  // Check for invalid surface first
 /* if (input.conditionedSurface <= 0) {
    return {
      becth: 0,
      energyClass: ClassificationGrade.NOT_APPLICABLE,
      classDescription: 'Surface conditionnée invalide',
      isApplicable: false,
      unit: EnergyUnit.KWH_PER_M2_YEAR
    };
  }
  */

  // Calculate BECTh for all building types (useful metric to display)
  Logger.info(`Heating load: ${input.heatingLoadClass} kWh/year`);
  Logger.info(`Cooling load: ${input.coolingLoadClass} kWh/year`);
  const becth = (input.heatingLoadClass) + (input.coolingLoadClass) ;  
  Logger.info(`BECTh: ${becth} kWh/year`);
  
  const thresholds = getThresholds(input.buildingType);

  // Classify based on thresholds
  const { class: energyClass, description } = classify(becth, thresholds!);

  return {
    becth: Number(becth.toFixed(2)),
    energyClass,
    classDescription: description,
    isApplicable: true,
    unit: EnergyUnit.KWH_PER_M2_YEAR
  };
}

