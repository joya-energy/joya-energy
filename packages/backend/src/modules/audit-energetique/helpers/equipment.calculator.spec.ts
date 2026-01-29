import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { EquipmentCategories } from '@shared/enums/audit-usage.enum';
import { computeEquipmentLoads, computePharmacyColdLoad } from '../../../modules/audit-energetique/helpers/equipment.calculator';

describe('computeEquipmentLoads', () => {
  it('sums 24/7 and usage-based categories then adds pharmacy refrigeration', () => {
    const result = computeEquipmentLoads({
      buildingType: BuildingTypes.PHARMACY,
      categories: [EquipmentCategories.INDUSTRIAL_COLD, EquipmentCategories.PRODUCTION_MACHINERY],
      usageFactor: 0.5,
      processFactor: 0.8,
      surface: 50
    });

    expect(result.perSquare).toBeCloseTo(198.64);
    expect(result.absoluteKwh).toBe(0);
  });

  it('ignores pharmacy cold load for non-pharmacy buildings', () => {
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

describe('computePharmacyColdLoad', () => {
  it('returns the closest threshold energy demand', () => {
    expect(computePharmacyColdLoad(30)).toBe(4818);
    expect(computePharmacyColdLoad(500)).toBe(10950);
  });
});

