/**
 * Project Calculator Service
 * Calculates project fundamentals: CAPEX, production, savings, OPEX
 * Pure business logic - no side effects
 */

import {
  ProjectInput,
  ProjectParameters,
  ProjectCalculation,
  FINANCING_CONSTANTS,
  InvalidInputError,
} from '@backend/domain/financing';

export class ProjectCalculatorService {
  /**
   * Calculates all project fundamentals
   */
  public calculateProject(
    input: ProjectInput,
    parameters: ProjectParameters
  ): ProjectCalculation {
    this.validateInput(input);

    const { capexDt, sizeKwp } = this.calculateCapexAndSize(input, parameters);

    const annualProductionKwh = this.calculateAnnualProduction(
      sizeKwp,
      parameters.yieldKwhPerKwpYear
    );

    const annualGrossSavingsDt = this.calculateAnnualSavings(
      annualProductionKwh,
      parameters.electricityPriceDtPerKwh
    );

    const monthlyGrossSavingsDt =
      annualGrossSavingsDt / FINANCING_CONSTANTS.MONTHS_PER_YEAR;

    const annualOpexDt = this.calculateAnnualOpex(
      capexDt,
      parameters.opexRateAnnual
    );

    const monthlyOpexDt = annualOpexDt / FINANCING_CONSTANTS.MONTHS_PER_YEAR;

    return {
      capexDt,
      sizeKwp,
      annualProductionKwh,
      annualGrossSavingsDt,
      monthlyGrossSavingsDt,
      annualOpexDt,
      monthlyOpexDt,
    };
  }

  /**
   * Validates user input
   */
  private validateInput(input: ProjectInput): void {
    const hasSize = input.installationSizeKwp !== undefined && input.installationSizeKwp !== null;
    const hasAmount = input.investmentAmountDt !== undefined && input.investmentAmountDt !== null;

    if (!hasSize && !hasAmount) {
      throw new InvalidInputError(
        'Either installationSizeKwp or investmentAmountDt must be provided'
      );
    }

    if (hasSize && hasAmount) {
      throw new InvalidInputError(
        'Only one of installationSizeKwp or investmentAmountDt should be provided'
      );
    }

    if (hasSize && input.installationSizeKwp! <= 0) {
      throw new InvalidInputError('installationSizeKwp must be positive');
    }

    if (hasAmount && input.investmentAmountDt! <= 0) {
      throw new InvalidInputError('investmentAmountDt must be positive');
    }
  }

  /**
   * Calculates CAPEX and installation size
   */
  private calculateCapexAndSize(
    input: ProjectInput,
    parameters: ProjectParameters
  ): { capexDt: number; sizeKwp: number } {
    if (input.installationSizeKwp !== undefined && input.installationSizeKwp !== null) {
      const capexDt = input.installationSizeKwp * parameters.costPerKwpDt;
      return { capexDt, sizeKwp: input.installationSizeKwp };
    }

    const capexDt = input.investmentAmountDt!;
    const sizeKwp = capexDt / parameters.costPerKwpDt;
    return { capexDt, sizeKwp };
  }

  /**
   * Calculates annual production in kWh
   */
  private calculateAnnualProduction(
    sizeKwp: number,
    yieldKwhPerKwpYear: number
  ): number {
    return sizeKwp * yieldKwhPerKwpYear;
  }

  /**
   * Calculates annual gross savings in DT
   */
  private calculateAnnualSavings(
    annualProductionKwh: number,
    electricityPriceDtPerKwh: number
  ): number {
    return annualProductionKwh * electricityPriceDtPerKwh;
  }

  /**
   * Calculates annual OPEX in DT
   */
  private calculateAnnualOpex(capexDt: number, opexRateAnnual: number): number {
    return capexDt * opexRateAnnual;
  }
}

