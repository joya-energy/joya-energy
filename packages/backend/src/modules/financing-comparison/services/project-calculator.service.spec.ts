/**
 * Project Calculator Service Tests
 */

import { ProjectCalculatorService } from './project-calculator.service';
import { InvalidInputError, DEFAULT_PROJECT_PARAMETERS } from '@backend/domain/financing';

describe('ProjectCalculatorService', () => {
  let service: ProjectCalculatorService;

  beforeEach(() => {
    service = new ProjectCalculatorService();
  });

  describe('calculateProject', () => {
    it('should calculate project from installation size', () => {
      const input = {
        location: 'tunis',
        installationSizeKwp: 50,
      };

      const result = service.calculateProject(input, DEFAULT_PROJECT_PARAMETERS);

      expect(result.sizeKwp).toBe(50);
      expect(result.capexDt).toBe(50 * DEFAULT_PROJECT_PARAMETERS.costPerKwpDt);
      expect(result.annualProductionKwh).toBe(
        50 * DEFAULT_PROJECT_PARAMETERS.yieldKwhPerKwpYear
      );
    });

    it('should calculate project from investment amount', () => {
      const input = {
        location: 'tunis',
        investmentAmountDt: 125000,
      };

      const result = service.calculateProject(input, DEFAULT_PROJECT_PARAMETERS);

      expect(result.capexDt).toBe(125000);
      expect(result.sizeKwp).toBe(125000 / DEFAULT_PROJECT_PARAMETERS.costPerKwpDt);
    });

    it('should throw error if neither size nor amount provided', () => {
      const input = {
        location: 'tunis',
      };

      expect(() => service.calculateProject(input, DEFAULT_PROJECT_PARAMETERS)).toThrow(
        InvalidInputError
      );
    });

    it('should throw error if both size and amount provided', () => {
      const input = {
        location: 'tunis',
        installationSizeKwp: 50,
        investmentAmountDt: 125000,
      };

      expect(() => service.calculateProject(input, DEFAULT_PROJECT_PARAMETERS)).toThrow(
        InvalidInputError
      );
    });

    it('should throw error for negative installation size', () => {
      const input = {
        location: 'tunis',
        installationSizeKwp: -50,
      };

      expect(() => service.calculateProject(input, DEFAULT_PROJECT_PARAMETERS)).toThrow(
        InvalidInputError
      );
    });

    it('should calculate OPEX correctly', () => {
      const input = {
        location: 'tunis',
        installationSizeKwp: 50,
      };

      const result = service.calculateProject(input, DEFAULT_PROJECT_PARAMETERS);

      const expectedAnnualOpex =
        result.capexDt * DEFAULT_PROJECT_PARAMETERS.opexRateAnnual;
      expect(result.annualOpexDt).toBeCloseTo(expectedAnnualOpex);
      expect(result.monthlyOpexDt).toBeCloseTo(expectedAnnualOpex / 12);
    });
  });
});

