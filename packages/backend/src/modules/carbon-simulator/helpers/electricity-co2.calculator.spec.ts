import { calculateElectricityCO2, type ElectricityCO2Input } from './electricity-co2.calculator';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';

describe('electricity-co2.calculator', () => {
  const baseInput: Omit<ElectricityCO2Input, 'monthlyAmountDt' | 'tariffType'> = {
    referenceMonth: 7, // Juillet
    buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
    climateZone: ClimateZones.NORTH,
  };

  it('calculates CO₂_elec for BT with a positive monthly amount', () => {
    const result = calculateElectricityCO2({
      ...baseInput,
      monthlyAmountDt: 200,
      tariffType: 'BT',
    });

    expect(result.monthlyConsumptionKwh).toBeGreaterThan(0);
    expect(result.annualConsumptionKwh).toBeGreaterThan(0);
    expect(result.co2EmissionsKg).toBeGreaterThan(0);
    // BT uses average price 0.391 DT/kWh
    expect(result.appliedRateDtPerKwh).toBeCloseTo(0.391, 3);
  });

  it('calculates CO₂_elec for MT uniforme', () => {
    const result = calculateElectricityCO2({
      ...baseInput,
      monthlyAmountDt: 200,
      tariffType: 'MT_UNIFORME',
    });

    expect(result.monthlyConsumptionKwh).toBeGreaterThan(0);
    expect(result.annualConsumptionKwh).toBeGreaterThan(0);
    expect(result.co2EmissionsKg).toBeGreaterThan(0);
  });

  it('returns zeros when monthly amount is 0', () => {
    const result = calculateElectricityCO2({
      ...baseInput,
      monthlyAmountDt: 0,
      tariffType: 'BT',
    });

    expect(result.monthlyConsumptionKwh).toBe(0);
    expect(result.annualConsumptionKwh).toBe(0);
    expect(result.co2EmissionsKg).toBe(0);
  });
});

