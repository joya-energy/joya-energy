import { describe, it, expect } from '@jest/globals';
import {
  extrapolateConsumption,
  calculateEffectiveCoefficient,
  calculateEnergyBase,
  extrapolateMonthlyConsumption,
  calculateAnnualConsumption,
  BuildingTypes,
  ClimateZones
} from './consumption-extrapolation.calculator';

describe('ConsumptionExtrapolationCalculator', () => {
  describe('calculateEffectiveCoefficient', () => {
    it('should calculate correct effective coefficient for office in north zone', () => {
      const result = calculateEffectiveCoefficient(7, BuildingTypes.OFFICE_ADMIN_BANK, ClimateZones.NORTH);
      expect(result).toBeCloseTo(1.15, 4); // 1.15 * 1 = 1.15
    });

    it('should calculate correct effective coefficient for cafe in center zone', () => {
      const result = calculateEffectiveCoefficient(7, BuildingTypes.CAFE_RESTAURANT, ClimateZones.CENTER);
      expect(result).toBeCloseTo(1.96, 4); // 1.4 * 1.4 = 1.96
    });
  });

  describe('calculateEnergyBase', () => {
    it('should calculate correct energy base', () => {
      const input = {
        measuredConsumption: 1200,
        referenceMonth: 7,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        climateZone: ClimateZones.NORTH,
      };

      const result = calculateEnergyBase(input);
      const expectedCoeff = 1.15; // Ki * Kzone for July
      const expected = 1200 / expectedCoeff;
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  describe('extrapolateMonthlyConsumption', () => {
    it('should extrapolate consumption for all months', () => {
      const baseConsumption = 1000;
      const result = extrapolateMonthlyConsumption(baseConsumption, BuildingTypes.OFFICE_ADMIN_BANK, ClimateZones.NORTH);

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe(1); // January
      expect(result[6].month).toBe(7); // July

      // Check that July (month 7) has the measured consumption pattern
      const julyResult = result[6];
      expect(julyResult.estimatedConsumption).toBeCloseTo(baseConsumption * 1.15, 2);
    });
  });

  describe('calculateAnnualConsumption', () => {
    it('should calculate total annual consumption', () => {
      const monthlyConsumptions = [
        { month: 1, estimatedConsumption: 1000, rawConsumption: 0, climaticCoefficient: 1, buildingCoefficient: 0.75, effectiveCoefficient: 0.75 },
        { month: 2, estimatedConsumption: 1050, rawConsumption: 0, climaticCoefficient: 1, buildingCoefficient: 0.8, effectiveCoefficient: 0.8 },
        // ... more months
      ] as any;

      // Mock 12 months
      for (let i = 2; i < 12; i++) {
        monthlyConsumptions.push({
          month: i + 1,
          estimatedConsumption: 1000 + i * 10,
          rawConsumption: 0,
          climaticCoefficient: 1,
          buildingCoefficient: 0.75 + i * 0.01,
          effectiveCoefficient: 0.75 + i * 0.01
        });
      }

      const result = calculateAnnualConsumption(monthlyConsumptions);
      const expected = monthlyConsumptions.reduce((sum, month) => sum + month.estimatedConsumption, 0);
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  describe('extrapolateConsumption', () => {
    it('should extrapolate consumption from monthly measurement', () => {
      const input = {
        measuredConsumption: 1500, // July consumption
        referenceMonth: 7,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        climateZone: ClimateZones.CENTER,
      };

      const result = extrapolateConsumption(input);

      expect(result.baseConsumption).toBeGreaterThan(0);
      expect(result.monthlyConsumptions).toHaveLength(12);
      expect(result.annualEstimatedConsumption).toBeGreaterThan(0);

      // July should have the highest coefficient for offices
      const julyConsumption = result.monthlyConsumptions.find(m => m.month === 7);
      expect(julyConsumption?.estimatedConsumption).toBeCloseTo(result.baseConsumption * 1.15 * 1.12, 2);
    });

    it('should handle different building types and zones', () => {
      const input = {
        measuredConsumption: 2000,
        referenceMonth: 8,
        buildingType: BuildingTypes.CAFE_RESTAURANT,
        climateZone: ClimateZones.SOUTH,
      };

      const result = extrapolateConsumption(input);

      expect(result.annualEstimatedConsumption).toBeGreaterThan(0);
      // Cafes have higher summer consumption
      const augustConsumption = result.monthlyConsumptions.find(m => m.month === 8);
      expect(augustConsumption?.estimatedConsumption).toBeGreaterThan(result.baseConsumption);
    });
  });
});
