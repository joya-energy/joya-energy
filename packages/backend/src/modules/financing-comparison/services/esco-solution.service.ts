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
  CalculationError,
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

    if (escoMonthlyPayment > monthlyGrossSavingsDt) {
      throw new CalculationError(
        `ESCO payment (${escoMonthlyPayment.toFixed(2)} DT) exceeds monthly savings (${monthlyGrossSavingsDt.toFixed(2)} DT). Project not viable for ESCO.`
      );
    }

    const totalMonthlyCost = escoMonthlyPayment;
    const monthlyCashflow = monthlyGrossSavingsDt - totalMonthlyCost;

    return {
      type: FinancingSolutionType.ESCO,
      initialInvestment: 0,
      monthlyPayment: escoMonthlyPayment,
      monthlyOpex: 0,
      totalMonthlyCost,
      monthlyCashflow,
      durationMonths: FINANCING_CONSTANTS.DURATION_MONTHS,
      durationYears: FINANCING_CONSTANTS.DURATION_YEARS,
      escoTargetIrrMonthly,
      escoTargetIrrAnnual: parameters.escoTargetIrrAnnual,
      escoOpexIncluded: parameters.escoOpexIncluded,
    };
  }

  /**
   * Calculates ESCO monthly payment to achieve target IRR
   * JOYA invests CAPEX and pays OPEX monthly
   * JOYA receives monthly payment from client
   */
  private calculateEscoMonthlyPayment(
    capexDt: number,
    monthlyOpexDt: number,
    targetIrrMonthly: number
  ): number {
    const annuityFactor =
      (targetIrrMonthly * Math.pow(1 + targetIrrMonthly, FINANCING_CONSTANTS.DURATION_MONTHS)) /
      (Math.pow(1 + targetIrrMonthly, FINANCING_CONSTANTS.DURATION_MONTHS) - 1);

    const escoMonthlyPayment = capexDt * annuityFactor + monthlyOpexDt;

    return escoMonthlyPayment;
  }
}

