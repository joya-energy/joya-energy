import { HeatingSystemTypes, DomesticHotWaterTypes } from '@shared/enums/audit-batiment.enum';
import { computeEnergySplit } from '../../../modules/audit-energetique/helpers/energy-split.calculator';

describe('computeEnergySplit', () => {
  it('assigns gas consumption to gas heating and ECS loads', () => {
    const result = computeEnergySplit({
      totalConsumption: 20000,
      heatingSystem: HeatingSystemTypes.GAS_BOILER,
      ecsType: DomesticHotWaterTypes.GAS,
      heatingLoadKwh: 6000,
      ecsLoadKwh: 2000
    });

    expect(result.gasConsumption).toBe(8000);
    expect(result.electricityConsumption).toBe(12000);
  });

  it('defaults all consumption to electricity when no gas systems exist', () => {
    const result = computeEnergySplit({
      totalConsumption: 10000,
      heatingSystem: HeatingSystemTypes.NONE,
      ecsType: DomesticHotWaterTypes.ELECTRIC,
      heatingLoadKwh: 0,
      ecsLoadKwh: 0
    });

    expect(result.gasConsumption).toBe(0);
    expect(result.electricityConsumption).toBe(10000);
  });
});

