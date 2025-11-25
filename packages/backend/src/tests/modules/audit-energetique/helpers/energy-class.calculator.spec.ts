import { BuildingTypes } from '@shared/enums/audit-general.enum';
import {
  computeEnergyClass,
  EnergyClass
} from '../../../modules/audit-energetique/helpers/energy-class.calculator';

describe('computeEnergyClass', () => {
  it('marks classification as not applicable for non-office buildings', () => {
    const result = computeEnergyClass({
      buildingType: BuildingTypes.PHARMACY,
      heatingLoad: 1000,
      coolingLoad: 500,
      conditionedSurface: 100
    });

    expect(result.isApplicable).toBe(false);
    expect(result.becth).toBeNull();
  });

  it('flags invalid conditioned surface even for offices', () => {
    const result = computeEnergyClass({
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
      heatingLoad: 1000,
      coolingLoad: 500,
      conditionedSurface: 0
    });

    expect(result.isApplicable).toBe(true);
    expect(result.energyClass).toBeNull();
    expect(result.classDescription).toBe('Surface conditionnée invalide');
  });

  it('computes BECTh and class for offices with valid data', () => {
    const result = computeEnergyClass({
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
      heatingLoad: 5000,
      coolingLoad: 3000,
      conditionedSurface: 100
    });

    expect(result.becth).toBe(80);
    expect(result.energyClass).toBe(EnergyClass.CLASS_2);
    expect(result.classDescription).toContain('Très bonne performance');
  });
});


