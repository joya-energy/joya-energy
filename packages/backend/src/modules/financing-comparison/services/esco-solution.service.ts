/**
 * ESCO Solution Service
 * Calculates ESCO JOYA financing solution with target IRR of 13%
 * JOYA finances 100% and includes OPEX
 */

import {
  EscoSolution,
  ProjectCalculation,
  EscoParameters,
  FinancingSolutionType,
  FINANCING_CONSTANTS
} from '@backend/domain/financing';

export class EscoSolutionService {
  /**
   * Calculates ESCO solution with target IRR
   */
  public calculate(
    projectCalculation: ProjectCalculation,
    parameters: EscoParameters
  ): EscoSolution {
    const capexDt = projectCalculation.capexDt;
    const monthlyGrossSavingsDt = projectCalculation.monthlyGrossSavingsDt;
    const monthlyOpexDt = projectCalculation.monthlyOpexDt;

    const escoTargetIrrMonthly =
      Math.pow(1 + parameters.escoTargetIrrAnnual, 1 / FINANCING_CONSTANTS.MONTHS_PER_YEAR) - 1;

    const escoMonthlyPayment = this.calculateEscoMonthlyPayment(
      capexDt,
      monthlyOpexDt,
      escoTargetIrrMonthly
    );

    const isViable = escoMonthlyPayment <= monthlyGrossSavingsDt;
    const viabilityError = isViable
      ? undefined
      : `ESCO payment (${escoMonthlyPayment.toFixed(2)} DT) exceeds monthly savings (${monthlyGrossSavingsDt.toFixed(2)} DT). Project not viable for ESCO.`;

    const totalMonthlyCost = isViable ? escoMonthlyPayment : 0;
    const monthlyCashflow = isViable ? monthlyGrossSavingsDt - totalMonthlyCost : 0;

    return {
      type: FinancingSolutionType.ESCO,
      initialInvestment: 0,
      monthlyPayment: isViable ? escoMonthlyPayment : 0,
      monthlyOpex: 0,
      totalMonthlyCost,
      monthlyCashflow,
      durationMonths: FINANCING_CONSTANTS.DURATION_MONTHS,
      durationYears: FINANCING_CONSTANTS.DURATION_YEARS,
      escoTargetIrrMonthly,
      escoTargetIrrAnnual: parameters.escoTargetIrrAnnual,
      escoOpexIncluded: parameters.escoOpexIncluded,
      isViable,
      viabilityError,
    };
  }

  /**
   * Calculates ESCO monthly payment to achieve target IRR
   * JOYA invests CAPEX upfront and includes OPEX in the service
   * JOYA receives monthly payment from client covering both CAPEX + OPEX costs
   */
  private calculateEscoMonthlyPayment(
    capexDt: number,
    monthlyOpexDt: number,
    targetIrrMonthly: number
  ): number {
    // ESCO invests CAPEX upfront and pays OPEX monthly
    // ESCO receives monthly payment from client
    // The payment should cover both CAPEX financing and OPEX costs

    // Calculate present value of OPEX annuity stream
    const opexPresentValue = monthlyOpexDt * (1 - Math.pow(1 + targetIrrMonthly, -FINANCING_CONSTANTS.DURATION_MONTHS)) / targetIrrMonthly;

    // Total present value that ESCO needs to recover (CAPEX + PV of OPEX)
    const totalPresentValue = capexDt + opexPresentValue;

    // Monthly payment to achieve target IRR (annuity formula)
    const escoMonthlyPayment = totalPresentValue * (targetIrrMonthly * Math.pow(1 + targetIrrMonthly, FINANCING_CONSTANTS.DURATION_MONTHS)) /
      (Math.pow(1 + targetIrrMonthly, FINANCING_CONSTANTS.DURATION_MONTHS) - 1);

    return escoMonthlyPayment;
  }
}

