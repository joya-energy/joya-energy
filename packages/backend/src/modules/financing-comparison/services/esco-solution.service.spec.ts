/**
 * ESCO Solution Service Tests
 */

import { EscoSolutionService } from './esco-solution.service';
import {
  FinancingSolutionType,
  FINANCING_CONSTANTS,
  CalculationError,
  DEFAULT_ESCO_PARAMETERS,
} from '@backend/domain/financing';

describe('EscoSolutionService', () => {
  let service: EscoSolutionService;

  beforeEach(() => {
    service = new EscoSolutionService();
  });

  describe('calculate', () => {
    it('should calculate ESCO solution correctly', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation, DEFAULT_ESCO_PARAMETERS);

      expect(result.type).toBe(FinancingSolutionType.ESCO);
      expect(result.initialInvestment).toBe(0);
      expect(result.monthlyOpex).toBe(0);
      expect(result.escoOpexIncluded).toBe(true);
      expect(result.escoTargetIrrAnnual).toBe(0.16);
      expect(result.durationYears).toBe(FINANCING_CONSTANTS.DURATION_YEARS);
    });

    it('should have zero initial investment', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation, DEFAULT_ESCO_PARAMETERS);

      expect(result.initialInvestment).toBe(0);
    });

    it('should have positive cashflow', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation, DEFAULT_ESCO_PARAMETERS);

      expect(result.monthlyCashflow).toBeGreaterThan(0);
    });

    it('should throw error if payment exceeds savings', () => {
      const projectCalculation = {
        sizeKwp: 10,
        capexDt: 500000,
        annualProductionKwh: 16800,
        annualGrossSavingsDt: 3024,
        monthlyGrossSavingsDt: 252,
        annualOpexDt: 7500,
        monthlyOpexDt: 625,
      };

      expect(() =>
        service.calculate(projectCalculation, DEFAULT_ESCO_PARAMETERS)
      ).toThrow(CalculationError);
    });

    it('should calculate monthly IRR correctly', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation, DEFAULT_ESCO_PARAMETERS);

      const expectedMonthlyIrr = Math.pow(1.16, 1 / 12) - 1;
      expect(result.escoTargetIrrMonthly).toBeCloseTo(expectedMonthlyIrr, 6);
    });
  });
});

