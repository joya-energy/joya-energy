import { describe, it, expect } from '@jest/globals';
import {
  calculatePVProduction,
  calculateAnnualProducible,
  calculateTheoreticalPVPower,
  calculateInstalledPVPower,
  calculateMonthlyPVProduction,
  calculateNetConsumptionAndCredits,
  calculateEnergyCoverageRate
} from './pv-production.calculator';

describe('PVProductionCalculator', () => {
  describe('calculateAnnualProducible', () => {
    it('should calculate annual producible energy', () => {
      const monthlyIrradiations = Array(12).fill(150); // 150 kWh/m²/month
      const installedPower = 10; // 10 kWp
      const systemEfficiency = 0.8;

      const result = calculateAnnualProducible(monthlyIrradiations, installedPower, systemEfficiency);

      // Expected: 12 months × 150 kWh/m² × 10 kWp × 0.8 = 14400 kWh
      expect(result).toBeCloseTo(14400, 2);
    });
  });

  describe('calculateTheoreticalPVPower', () => {
    it('should calculate theoretical PV power', () => {
      const annualConsumption = 20000; // 20 MWh
      const annualProducible = 16000; // 16 MWh

      const result = calculateTheoreticalPVPower(annualConsumption, annualProducible);

      // Expected: 20000 / 16000 = 1.25 kWp
      expect(result).toBeCloseTo(1.25, 2);
    });

    it('should handle zero producible', () => {
      const result = calculateTheoreticalPVPower(10000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateInstalledPVPower', () => {
    it('should use theoretical power when no constraint', () => {
      const result = calculateInstalledPVPower(5.5);
      expect(result).toBe(5.5);
    });

    it('should respect maximum power constraint', () => {
      const result = calculateInstalledPVPower(10, 8);
      expect(result).toBe(8);
    });
  });

  describe('calculateMonthlyPVProduction', () => {
    it('should calculate monthly PV production', () => {
      const monthlyIrradiations = [120, 130, 150, 160, 180, 200, 210, 200, 180, 150, 130, 120];
      const installedPower = 5; // 5 kWp
      const systemEfficiency = 0.8;

      const result = calculateMonthlyPVProduction(installedPower, monthlyIrradiations, systemEfficiency);

      expect(result).toHaveLength(12);
      // July should have highest production
      expect(result[6]).toBeCloseTo(210 * 5 * 0.8, 2); // 840 kWh
      // January should have lowest
      expect(result[0]).toBeCloseTo(120 * 5 * 0.8, 2); // 480 kWh
    });
  });

  describe('calculateNetConsumptionAndCredits', () => {
    it('should calculate net consumption with credits rollover', () => {
      const monthlyRawConsumptions = [1000, 900, 800, 700, 600, 500, 400, 500, 600, 700, 800, 900];
      const monthlyPVProductions = [200, 250, 300, 350, 400, 450, 500, 450, 400, 350, 300, 250];

      const result = calculateNetConsumptionAndCredits(monthlyRawConsumptions, monthlyPVProductions);

      expect(result).toHaveLength(12);

      // July: raw 400 - PV 500 = -100 → credit 100, net 0
      expect(result[6].netConsumption).toBe(0);
      expect(result[6].credit).toBe(100);

      // August: raw 500 - PV 450 = 50 + credit 100 = 150 → net 150, credit 0
      expect(result[7].netConsumption).toBe(150);
      expect(result[7].credit).toBe(0);
    });

    it('should handle credit rollover across year boundary', () => {
      // December has surplus that carries to next year (simulated)
      const monthlyRawConsumptions = Array(12).fill(1000);
      const monthlyPVProductions = Array(12).fill(1200); // Always more production than consumption

      const result = calculateNetConsumptionAndCredits(monthlyRawConsumptions, monthlyPVProductions);

      // Each month: 1000 - 1200 = -200 → credit accumulates
      let expectedCredit = 0;
      result.forEach((month, index) => {
        expectedCredit += 200;
        expect(month.netConsumption).toBe(0);
        expect(month.credit).toBe(expectedCredit);
      });
    });
  });

  describe('calculateEnergyCoverageRate', () => {
    it('should calculate coverage rate', () => {
      const annualPVProduction = 12000;
      const annualConsumption = 20000;

      const result = calculateEnergyCoverageRate(annualPVProduction, annualConsumption);

      // Expected: 12000 / 20000 * 100 = 60%
      expect(result).toBe(60);
    });

    it('should handle zero consumption', () => {
      const result = calculateEnergyCoverageRate(1000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculatePVProduction', () => {
    it('should calculate complete PV production analysis', () => {
      const input = {
        annualConsumption: 24000, // 24 MWh
        annualProductible: 1800, // 1800 kWh/m²
        monthlyConsumptions: Array(12).fill(2000), // 2000 kWh/month each
      };

      const result = calculatePVProduction(input);

      expect(result.installedPower).toBeGreaterThan(0);
      expect(result.annualProducible).toBeGreaterThan(0);
      expect(result.annualPVProduction).toBeGreaterThan(0);
      expect(result.energyCoverageRate).toBeGreaterThan(0);
      expect(result.monthlyProductions).toHaveLength(12);
    });

    it('should respect installed power constraint', () => {
      const input = {
        annualConsumption: 50000,
        annualProductible: 1800,
        monthlyConsumptions: Array(12).fill(4167),
        installedPower: 20, // Limit to 20 kWp
      };

      const result = calculatePVProduction(input);

      expect(result.installedPower).toBe(20);
    });
  });
});
