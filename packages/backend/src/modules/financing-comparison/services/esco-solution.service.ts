/**
 * ESCO Solution Service
 * Calculates ESCO JOYA financing solution with target IRR of 16%
 * JOYA finances 100% and includes OPEX
 */

import {
  EscoSolution,
  ProjectCalculation,
  EscoParameters,
  FinancingSolutionType,
  FINANCING_CONSTANTS,
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

    const escoTargetIrrMonthly =
      Math.pow(1 + parameters.escoTargetIrrAnnual, 1 / FINANCING_CONSTANTS.MONTHS_PER_YEAR) - 1;

    const escoMonthlyPayment = this.calculateEscoMonthlyPayment(
      capexDt,
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
   * JOYA invests CAPEX and pays OPEX monthly
   * JOYA receives monthly payment from client
   */
  private calculateEscoMonthlyPayment(
    capexDt: number,
    targetIrrMonthly: number
  ): number {
    const annuityFactor =
      (targetIrrMonthly * Math.pow(1 + targetIrrMonthly, FINANCING_CONSTANTS.DURATION_MONTHS)) /
      (Math.pow(1 + targetIrrMonthly, FINANCING_CONSTANTS.DURATION_MONTHS) - 1);

    const escoMonthlyPayment = capexDt * annuityFactor;

    return escoMonthlyPayment;
  }
}

