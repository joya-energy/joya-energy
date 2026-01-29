import {
  DomesticHotWaterTypes,
  GlazingTypes,
  HeatingSystemTypes,
  InsulationQualities,
  CoolingSystemTypes
} from '@shared/enums/audit-batiment.enum';
import { EquipmentCategories, ExistingMeasures, LightingTypes } from '@shared/enums/audit-usage.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energetique.enum';

export interface RecommendationInput {
  lightingType: LightingTypes;
  insulation: InsulationQualities;
  glazingType: GlazingTypes;
  coolingSystem: CoolingSystemTypes;
  heatingSystem: HeatingSystemTypes;
  domesticHotWater: DomesticHotWaterTypes;
  equipmentCategories: EquipmentCategories[];
  existingMeasures: ExistingMeasures[];
  tariffType: EnergyTariffTypes;
}

/**
 * Builds personalized energy efficiency recommendations
 * Based on current equipment and practices
 */
export function buildRecommendations(input: RecommendationInput): string[] {
  const recommendations: string[] = [];

  if (input.lightingType !== LightingTypes.LED) {
    recommendations.push(
      'Remplacez votre éclairage par des LED pour réduire votre consommation jusqu\'à 20 %.'
    );
  }

  if (input.insulation !== InsulationQualities.HIGH || input.glazingType === GlazingTypes.SINGLE) {
    recommendations.push(
      'Améliorez l\'isolation et le vitrage (double vitrage, traitement toiture/façade) pour limiter les pertes.'
    );
  }

  if (input.coolingSystem !== CoolingSystemTypes.NONE) {
    recommendations.push(
      'Installez un pilotage intelligent ou programmez une maintenance des systèmes de climatisation pour limiter les dérives.'
    );
  }

  if (input.heatingSystem === HeatingSystemTypes.GAS_BOILER) {
    recommendations.push(
      'Étudiez la mise en place d\'une chaudière à haut rendement ou d\'une pompe à chaleur.'
    );
  }

  if (!input.existingMeasures.includes(ExistingMeasures.SOLAR_PV)) {
    recommendations.push(
      'Simulez un projet solaire pour compenser une partie de votre facture STEG.'
    );
  }

  if (input.domesticHotWater === DomesticHotWaterTypes.ELECTRIC) {
    recommendations.push(
      'Envisagez un chauffe-eau solaire ou une pompe à chaleur pour l\'ECS afin de réduire les coûts.'
    );
  }

  if (input.equipmentCategories.includes(EquipmentCategories.PRODUCTION_MACHINERY)) {
    recommendations.push(
      'Optimisez les horaires de production et installez des variateurs de vitesse sur les moteurs critiques.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Maintenez vos bonnes pratiques et prévoyez un suivi annuel de votre performance énergétique.'
    );
  }

  return recommendations;
}

/**
 * Estimates savings potential based on current state
 * Returns percentage of potential savings (5-40%)
 */
export function estimateSavingsPotential(input: RecommendationInput): number {
  let potential = 8;

  if (input.tariffType === EnergyTariffTypes.BT) {
    potential += 15;
  }

  if (input.lightingType !== LightingTypes.LED) {
    potential += input.lightingType === LightingTypes.FLUORESCENT ? 6 : 10;
  }

  if (input.insulation !== InsulationQualities.HIGH) {
    potential += input.insulation === InsulationQualities.MEDIUM ? 5 : 10;
  }

  if (input.coolingSystem !== CoolingSystemTypes.NONE) {
    potential += 6;
  }

  if (input.heatingSystem !== HeatingSystemTypes.NONE) {
    potential += 4;
  }

  if (!input.existingMeasures.includes(ExistingMeasures.SOLAR_PV)) {
    potential += 3;
  }

  return Math.min(Math.max(Number(potential.toFixed(1)), 5), 40);
}



