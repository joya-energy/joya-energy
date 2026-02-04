/**
 * Cash Solution Service Tests
 */

import { CashSolutionService } from './cash-solution.service';
import { FinancingSolutionType, FINANCING_CONSTANTS } from '@backend/domain/financing';

describe('CashSolutionService', () => {
  let service: CashSolutionService;

  beforeEach(() => {
    service = new CashSolutionService();
  });

  describe('calculate', () => {
    it('should calculate cash solution correctly', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation);

      expect(result.type).toBe(FinancingSolutionType.CASH);
      expect(result.initialInvestment).toBe(125000);
      expect(result.monthlyPayment).toBe(0);
      expect(result.monthlyOpex).toBe(156.25);
      expect(result.totalMonthlyCost).toBe(156.25);
      expect(result.monthlyCashflow).toBeCloseTo(1260 - 156.25);
      expect(result.durationYears).toBe(FINANCING_CONSTANTS.DURATION_YEARS);
      expect(result.durationMonths).toBe(FINANCING_CONSTANTS.DURATION_MONTHS);
    });

    it('should have zero monthly payment', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation);

      expect(result.monthlyPayment).toBe(0);
    });

    it('should have positive cashflow when savings exceed OPEX', () => {
      const projectCalculation = {
        sizeKwp: 50,
        capexDt: 125000,
        annualProductionKwh: 84000,
        annualGrossSavingsDt: 15120,
        monthlyGrossSavingsDt: 1260,
        annualOpexDt: 1875,
        monthlyOpexDt: 156.25,
      };

      const result = service.calculate(projectCalculation);

      expect(result.monthlyCashflow).toBeGreaterThan(0);
    });
  });
});

