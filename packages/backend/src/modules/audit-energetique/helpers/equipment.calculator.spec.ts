import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { EquipmentCategories } from '@shared/enums/audit-usage.enum';
import { computeEquipmentLoads } from '../../../modules/audit-energetique/helpers/equipment.calculator';

describe('computeEquipmentLoads', () => {
  it('sums 24/7 and usage-based categories', () => {
    const result = computeEquipmentLoads({
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
      categories: [EquipmentCategories.PRODUCTION_MACHINERY],
      usageFactor: 0.5,
      processFactor: 0.8,
      surface: 50
    });

    expect(result.perSquare).toBeCloseTo(16);
  });
});

