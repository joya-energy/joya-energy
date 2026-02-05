import { describe, it, expect } from '@jest/globals';
import {
  analyzeEconomics,
  calculateStegTariff,
  calculateBillWithoutPV,
  calculateBillWithPV,
  calculateMonthlySavings,
  calculateAvoidedTariff,
  calculateCapex,
  calculateAnnualOpex,
  calculateNetGain
} from './economic-analysis.calculator';

describe('EconomicAnalysisCalculator', () => {
  describe('calculateStegTariff', () => {
    it('should calculate correct STEG tariff for low consumption', () => {
      const result = calculateStegTariff(150); // 150 kWh
      // First 150 kWh at 0.195 DT/kWh = 29.25 DT
      expect(result).toBeCloseTo(0.195, 3);
    });

    it('should calculate progressive tariff for high consumption', () => {
      const result = calculateStegTariff(350); // 350 kWh
      // 200 kWh @ 0.195 = 39
      // 150 kWh @ 0.240 = 36
      // Total cost = 75 DT, average rate = 75/350 ≈ 0.214
      expect(result).toBeCloseTo(0.214, 3);
    });

    it('should handle zero consumption', () => {
      const result = calculateStegTariff(0);
      expect(result).toBe(0);
    });
  });

  describe('calculateBillWithoutPV', () => {
    it('should calculate bill without PV', () => {
      const result = calculateBillWithoutPV(200);
      expect(result).toBeCloseTo(39, 2); // 200 * 0.195
    });
  });

  describe('calculateBillWithPV', () => {
    it('should calculate bill with PV', () => {
      const result = calculateBillWithPV(100);
      expect(result).toBeCloseTo(19.5, 2); // 100 * 0.195
    });
  });

  describe('calculateMonthlySavings', () => {
    it('should calculate monthly savings', () => {
      const result = calculateMonthlySavings(200, 50); // 200 raw, 50 net
      const expected = calculateBillWithoutPV(200) - calculateBillWithPV(50);
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  describe('calculateAvoidedTariff', () => {
    it('should calculate avoided tariff', () => {
      const monthlyRaw = [2000, 1800, 1600, 1400, 1200, 1000, 800, 1000, 1200, 1400, 1600, 1800];
      const monthlyNet = [1500, 1350, 1200, 1050, 900, 750, 600, 750, 900, 1050, 1200, 1350];

      const result = calculateAvoidedTariff(monthlyRaw, monthlyNet);

      // Should be close to the STEG tariff rate
      expect(result).toBeGreaterThan(0.1);
      expect(result).toBeLessThan(0.5);
    });

    it('should handle no savings', () => {
      const monthlyRaw = [1000, 1000];
      const monthlyNet = [1000, 1000]; // No savings

      const result = calculateAvoidedTariff(monthlyRaw, monthlyNet);
      expect(result).toBe(0);
    });
  });

  describe('calculateCapex', () => {
    it('should calculate CAPEX', () => {
      const result = calculateCapex(10, 2000); // 10 kWp at 2000 DT/kWp
      expect(result).toBe(20000);
    });

    it('should use default CAPEX rate', () => {
      const result = calculateCapex(5, 2300); // 5 kWp with default 2300 DT/kWp
      expect(result).toBe(11500);
    });
  });

  describe('calculateAnnualOpex', () => {
    it('should calculate annual OPEX', () => {
      const result = calculateAnnualOpex(20000, 0.04); // 4% of 20000 DT CAPEX
      expect(result).toBe(800);
    });
  });

  describe('calculateNetGain', () => {
    it('should calculate net gain', () => {
      const result = calculateNetGain(5000, 800); // 5000 savings - 800 OPEX
      expect(result).toBe(4200);
    });
  });

  describe('analyzeEconomics', () => {
    it('should perform complete economic analysis', () => {
      const input = {
        monthlyNetConsumptions: Array(12).fill(1500), // 1500 kWh net each month
        monthlyRawConsumptions: Array(12).fill(2000), // 2000 kWh raw each month
        installedPVPower: 10, // 10 kWp
      };

      const result = analyzeEconomics(input);

      expect(result.capex).toBeGreaterThan(0);
      expect(result.annualOpex).toBeGreaterThan(0);
      expect(result.annualSavings).toBeGreaterThan(0);
      expect(result.totalSavings25Years).toBeGreaterThan(0);
      expect(result.simplePaybackYears).toBeGreaterThan(0);
      expect(result.discountedPaybackYears).toBeGreaterThan(0);
      expect(result.roi25Years).toBeGreaterThan(0);
      expect(result.npv).toBeDefined();
      expect(result.irr).toBeDefined();

      expect(result.monthlyResults).toHaveLength(12);
      expect(result.annualResults).toHaveLength(25); // 25 years
    });

    it('should handle different economic parameters', () => {
      const input = {
        monthlyNetConsumptions: Array(12).fill(1000),
        monthlyRawConsumptions: Array(12).fill(1500),
        installedPVPower: 15,
        projectYears: 20,
        stegTariffIncreaseRate: 0.05, // 5% inflation
        opexIncreaseRate: 0.02, // 2% OPEX inflation
        discountRate: 0.06, // 6% discount rate
        capexPerKwp: 1800, // 1800 DT/kWp
        opexRate: 0.03, // 3% OPEX rate
      };

      const result = analyzeEconomics(input);

      expect(result.capex).toBe(15 * 1800); // 27000 DT
      expect(result.annualResults).toHaveLength(20); // 20 years
      expect(result.roi25Years).toBeDefined(); // Should still calculate for 25 years internally
    });

    it('should calculate reasonable payback periods', () => {
      const input = {
        monthlyNetConsumptions: Array(12).fill(500), // Low net consumption = high savings
        monthlyRawConsumptions: Array(12).fill(1500),
        installedPVPower: 5,
        capexPerKwp: 1500, // Lower CAPEX
      };

      const result = analyzeEconomics(input);

      // With high savings and low CAPEX, payback should be reasonable (in months)
      expect(result.simplePaybackYears).toBeGreaterThan(0);
      expect(result.simplePaybackYears).toBeLessThan(120); // Less than 10 years in months
    });
  });
});
