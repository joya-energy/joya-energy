/**
 * Leasing Solution Service
 * Calculates leasing financing solution with residual value
 */

import {
  LeasingSolution,
  ProjectCalculation,
  LeasingParameters,
  FinancingSolutionType,
  FINANCING_CONSTANTS,
} from '@backend/domain/financing';

export class LeasingSolutionService {
  /**
   * Calculates leasing solution
   */
  public calculate(
    projectCalculation: ProjectCalculation,
    parameters: LeasingParameters
  ): LeasingSolution {
    const capexDt = projectCalculation.capexDt;
    const leasingDownPaymentDt = capexDt * parameters.selfFinancingRate;
    const leasingResidualValueDt = capexDt * parameters.leasingResidualValueRate;

    const leasingMonthlyRate = parameters.leasingAnnualRate / FINANCING_CONSTANTS.MONTHS_PER_YEAR;
    const amortizableAmount = capexDt - leasingDownPaymentDt - leasingResidualValueDt;

    let leasingMonthlyPayment = 0;
    if (amortizableAmount > 0 && leasingMonthlyRate > 0) {
      leasingMonthlyPayment =
        (amortizableAmount * leasingMonthlyRate) /
        (1 - Math.pow(1 + leasingMonthlyRate, -FINANCING_CONSTANTS.DURATION_MONTHS));
    }

    const leasingOpexMonthly =
      projectCalculation.monthlyOpexDt * parameters.leasingOpexMultiplier;
    const totalMonthlyCost = leasingMonthlyPayment + leasingOpexMonthly;
    const monthlyCashflow =
      projectCalculation.monthlyGrossSavingsDt - totalMonthlyCost;

    return {
      type: FinancingSolutionType.LEASING,
      initialInvestment: leasingDownPaymentDt,
      monthlyPayment: leasingMonthlyPayment,
      monthlyOpex: leasingOpexMonthly,
      totalMonthlyCost,
      monthlyCashflow,
      durationMonths: FINANCING_CONSTANTS.DURATION_MONTHS,
      durationYears: FINANCING_CONSTANTS.DURATION_YEARS,
      leasingMonthlyRate,
      leasingAnnualRate: parameters.leasingAnnualRate,
      leasingDownPaymentDt,
      leasingResidualValueDt,
      leasingResidualValueRate: parameters.leasingResidualValueRate,
    };
  }
}

