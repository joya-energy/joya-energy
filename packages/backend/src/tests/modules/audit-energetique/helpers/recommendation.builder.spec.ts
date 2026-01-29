import {
  LightingTypes,
  InsulationQualities,
  GlazingTypes,
  CoolingSystemTypes,
  HeatingSystemTypes,
  DomesticHotWaterTypes
} from '@shared/enums/audit-batiment.enum';
import { EquipmentCategories, ExistingMeasures } from '@shared/enums/audit-usage.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energetique.enum';
import {
  buildRecommendations,
  estimateSavingsPotential
} from '../../../modules/audit-energetique/helpers/recommendation.builder';

const inefficientInput = {
  lightingType: LightingTypes.INCANDESCENT,
  insulation: InsulationQualities.LOW,
  glazingType: GlazingTypes.SINGLE,
  coolingSystem: CoolingSystemTypes.SPLIT,
  heatingSystem: HeatingSystemTypes.GAS_BOILER,
  domesticHotWater: DomesticHotWaterTypes.ELECTRIC,
  equipmentCategories: [EquipmentCategories.PRODUCTION_MACHINERY],
  existingMeasures: [],
  tariffType: EnergyTariffTypes.BT
};

const efficientInput = {
  lightingType: LightingTypes.LED,
  insulation: InsulationQualities.HIGH,
  glazingType: GlazingTypes.DOUBLE,
  coolingSystem: CoolingSystemTypes.NONE,
  heatingSystem: HeatingSystemTypes.NONE,
  domesticHotWater: DomesticHotWaterTypes.NONE,
  equipmentCategories: [],
  existingMeasures: [ExistingMeasures.SOLAR_PV],
  tariffType: EnergyTariffTypes.MT
};

describe('buildRecommendations', () => {
  it('returns targeted recommendations based on weaknesses', () => {
    const recommendations = buildRecommendations(inefficientInput);

    expect(recommendations).toHaveLength(7);
    expect(recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('éclairage'),
        expect.stringContaining('isolation'),
        expect.stringContaining('climatisation'),
        expect.stringContaining('chaudière'),
        expect.stringContaining('solaire'),
        expect.stringContaining('ECS'),
        expect.stringContaining('production')
      ])
    );
  });

  it('falls back to positive message when no action is needed', () => {
    const recommendations = buildRecommendations(efficientInput);

    expect(recommendations).toEqual([
      'Maintenez vos bonnes pratiques et prévoyez un suivi annuel de votre performance énergétique.'
    ]);
  });
});

describe('estimateSavingsPotential', () => {
  it('returns bounded savings between 5% and 40%', () => {
    expect(estimateSavingsPotential(inefficientInput)).toBe(40);
    expect(estimateSavingsPotential(efficientInput)).toBeGreaterThanOrEqual(5);
  });
});


