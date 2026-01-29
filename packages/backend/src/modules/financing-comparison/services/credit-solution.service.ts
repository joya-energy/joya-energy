/**
 * Credit Solution Service
 * Calculates bank credit financing solution with constant monthly payment
 */

import {
  CreditSolution,
  ProjectCalculation,
  CreditParameters,
  FinancingSolutionType,
  FINANCING_CONSTANTS,
} from '@backend/domain/financing';

export class CreditSolutionService {
  /**
   * Calculates credit solution with constant monthly payment (annuity)
   */
  public calculate(
    projectCalculation: ProjectCalculation,
    parameters: CreditParameters
  ): CreditSolution {
    const capexDt = projectCalculation.capexDt;
    const selfFinancingDt = capexDt * parameters.selfFinancingRate;
    const financedPrincipalDt = capexDt - selfFinancingDt;

    const creditMonthlyRate = parameters.creditAnnualRate / FINANCING_CONSTANTS.MONTHS_PER_YEAR;

    let creditMonthlyPayment = 0;
    if (financedPrincipalDt > 0 && creditMonthlyRate > 0) {
      creditMonthlyPayment =
        (financedPrincipalDt * creditMonthlyRate) /
        (1 - Math.pow(1 + creditMonthlyRate, -FINANCING_CONSTANTS.DURATION_MONTHS));
    }

    const monthlyOpex = projectCalculation.monthlyOpexDt;
    const totalMonthlyCost = creditMonthlyPayment + monthlyOpex;
    const monthlyCashflow =
      projectCalculation.monthlyGrossSavingsDt - totalMonthlyCost;

    return {
      type: FinancingSolutionType.CREDIT,
      initialInvestment: selfFinancingDt,
      monthlyPayment: creditMonthlyPayment,
      monthlyOpex,
      totalMonthlyCost,
      monthlyCashflow,
      durationMonths: FINANCING_CONSTANTS.DURATION_MONTHS,
      durationYears: FINANCING_CONSTANTS.DURATION_YEARS,
      creditMonthlyRate,
      creditAnnualRate: parameters.creditAnnualRate,
      selfFinancingDt,
      financedPrincipalDt,
    };
  }
}

