/**
 * Comparison Service
 * Main orchestrator for financing comparison
 * Coordinates all solution calculations
 */

import {
  ProjectInput,
  ProjectParameters,
  CreditParameters,
  LeasingParameters,
  EscoParameters,
  CalculatedComparisonResult,
  getLocationYields,
  DEFAULT_PROJECT_PARAMETERS,
  DEFAULT_CREDIT_PARAMETERS,
  DEFAULT_LEASING_PARAMETERS,
  DEFAULT_ESCO_PARAMETERS,
  InvalidLocationError,
} from '@backend/domain/financing';
import { Governorates } from '@shared/enums/audit-general.enum';
import { ProjectCalculatorService } from './project-calculator.service';
import { CashSolutionService } from './cash-solution.service';
import { CreditSolutionService } from './credit-solution.service';
import { LeasingSolutionService } from './leasing-solution.service';
import { EscoSolutionService } from './esco-solution.service';

export class ComparisonService {
  private projectCalculator: ProjectCalculatorService;
  private cashSolution: CashSolutionService;
  private creditSolution: CreditSolutionService;
  private leasingSolution: LeasingSolutionService;
  private escoSolution: EscoSolutionService;

  constructor() {
    this.projectCalculator = new ProjectCalculatorService();
    this.cashSolution = new CashSolutionService();
    this.creditSolution = new CreditSolutionService();
    this.leasingSolution = new LeasingSolutionService();
    this.escoSolution = new EscoSolutionService();
  }

  /**
   * Compares all financing solutions for a project
   */
  public async compareAllSolutions(
    input: ProjectInput,
    creditParams?: Partial<CreditParameters>,
    leasingParams?: Partial<LeasingParameters>,
    escoParams?: Partial<EscoParameters>
  ): Promise<CalculatedComparisonResult> {
    const projectParams = await this.getProjectParameters(input.location);

    const creditParameters: CreditParameters = {
      ...DEFAULT_CREDIT_PARAMETERS,
      ...creditParams,
    };

    const leasingParameters: LeasingParameters = {
      ...DEFAULT_LEASING_PARAMETERS,
      ...leasingParams,
    };

    const escoParameters: EscoParameters = {
      ...DEFAULT_ESCO_PARAMETERS,
      ...escoParams,
    };

    const projectCalculation = this.projectCalculator.calculateProject(
      input,
      projectParams
    );

    const cash = this.cashSolution.calculate(projectCalculation);
    const credit = this.creditSolution.calculate(projectCalculation, creditParameters);
    const leasing = this.leasingSolution.calculate(projectCalculation, leasingParameters);
    const esco = this.escoSolution.calculate(projectCalculation, escoParameters);

    return {
      input,
      projectCalculation,
      cash,
      credit,
      leasing,
      esco,
    };
  }

  /**
   * Gets project parameters based on location
   */
  private async getProjectParameters(location: Governorates): Promise<ProjectParameters> {
    // Get dynamic location yields from PVGIS
    const locationYields = await getLocationYields();

    // Governorates enum values are already the correct keys
    if (!(location in locationYields)) {
      throw new InvalidLocationError(location);
    }

    const yieldKwhPerKwpYear = locationYields[location];

    return {
      costPerKwpDt: DEFAULT_PROJECT_PARAMETERS.costPerKwpDt,
      yieldKwhPerKwpYear,
      electricityPriceDtPerKwh: DEFAULT_PROJECT_PARAMETERS.electricityPriceDtPerKwh,
      opexRateAnnual: DEFAULT_PROJECT_PARAMETERS.opexRateAnnual,
    };
  }
}

