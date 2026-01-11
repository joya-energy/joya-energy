/**
 * Cash Solution Service
 * Calculates cash payment (comptant) financing solution
 * 100% upfront payment, no monthly payment, only OPEX
 */

import {
  CashSolution,
  ProjectCalculation,
  FinancingSolutionType,
  FINANCING_CONSTANTS,
} from '@backend/domain/financing';

export class CashSolutionService {
  /**
   * Calculates cash payment solution
   */
  public calculate(projectCalculation: ProjectCalculation): CashSolution {
    const initialInvestment = projectCalculation.capexDt;
    const monthlyPayment = 0;
    const monthlyOpex = projectCalculation.monthlyOpexDt;
    const totalMonthlyCost = monthlyOpex;
    const monthlyCashflow =
      projectCalculation.monthlyGrossSavingsDt - totalMonthlyCost;

    return {
      type: FinancingSolutionType.CASH,
      initialInvestment,
      monthlyPayment,
      monthlyOpex,
      totalMonthlyCost,
      monthlyCashflow,
      durationMonths: FINANCING_CONSTANTS.DURATION_MONTHS,
      durationYears: FINANCING_CONSTANTS.DURATION_YEARS,
    };
  }
}

