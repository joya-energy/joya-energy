import { EnergyTariffTypes } from '@shared/enums/audit-energetique.enum';
import {
  computeAnnualConsumptionFromBill,
  computeEnergyIntensity
} from '../../../modules/audit-energetique/helpers/tariff.calculator';

describe('computeAnnualConsumptionFromBill', () => {
  it('converts monthly bill to annual consumption using tariff rates', () => {
    expect(computeAnnualConsumptionFromBill(380, EnergyTariffTypes.BT)).toBe(12000);
  });

  it('fallbacks to BT rate when tariff type is missing', () => {
    expect(computeAnnualConsumptionFromBill(0, undefined as unknown as EnergyTariffTypes)).toBe(0);
  });
});

describe('computeEnergyIntensity', () => {
  it('returns zero when surface is invalid', () => {
    expect(computeEnergyIntensity(1000, 0)).toBe(0);
  });

  it('calculates kWh per square meter per year', () => {
    expect(computeEnergyIntensity(12000, 200)).toBe(60);
  });
});


