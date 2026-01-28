/**
 * Domain types for financing comparison module
 * All monetary values in DT (Tunisian Dinar)
 * All rates as decimals (0.16 = 16%)
 *
 * These types represent the core business domain of JOYA's financing comparison engine.
 */

import { Governorates } from '@shared/enums/audit-general.enum';

export enum FinancingSolutionType {
  CASH = 'cash',
  CREDIT = 'credit',
  LEASING = 'leasing',
  ESCO = 'esco',
}

/**
 * User input for financing comparison
 * RULE: User provides EITHER installationSizeKwp OR investmentAmountDt, never both
 */
export interface ProjectInput {
  location: Governorates;
  installationSizeKwp?: number;
  investmentAmountDt?: number;
}

/**
 * Project configuration parameters (JOYA config)
 */
export interface ProjectParameters {
  costPerKwpDt: number;
  yieldKwhPerKwpYear: number;
  electricityPriceDtPerKwh: number;
  opexRateAnnual: number;
}

/**
 * Credit financing parameters
 */
export interface CreditParameters {
  creditAnnualRate: number;
  selfFinancingRate: number;
}

/**
 * Leasing financing parameters
 */
export interface LeasingParameters {
  leasingAnnualRate: number;
  leasingResidualValueRate: number;
  leasingOpexMultiplier: number;
  selfFinancingRate: number;
}

/**
 * ESCO JOYA parameters
 */
export interface EscoParameters {
  escoTargetIrrAnnual: number;
  escoOpexIncluded: boolean;
  escoCostPerKwpDt?: number; // Optional: if not provided, uses DEFAULT_PROJECT_PARAMETERS.costPerKwpDt
}

/**
 * Calculated project fundamentals (common base for all solutions)
 */
export interface ProjectCalculation {
  sizeKwp: number;
  capexDt: number;
  annualProductionKwh: number;
  annualGrossSavingsDt: number;
  monthlyGrossSavingsDt: number;
  annualOpexDt: number;
  monthlyOpexDt: number;
}

/**
 * Base financing solution result
 */
export interface FinancingSolution {
  type: FinancingSolutionType;
  initialInvestment: number;
  monthlyPayment: number;
  monthlyOpex: number;
  totalMonthlyCost: number;
  monthlyCashflow: number;
  durationMonths: number;
  durationYears: number;
}

/**
 * Cash payment solution
 */
export interface CashSolution extends FinancingSolution {
  type: FinancingSolutionType.CASH;
}

/**
 * Bank credit solution
 */
export interface CreditSolution extends FinancingSolution {
  type: FinancingSolutionType.CREDIT;
  creditMonthlyRate: number;
  creditAnnualRate: number;
  selfFinancingDt: number;
  financedPrincipalDt: number;
}

/**
 * Leasing solution
 */
export interface LeasingSolution extends FinancingSolution {
  type: FinancingSolutionType.LEASING;
  leasingMonthlyRate: number;
  leasingAnnualRate: number;
  leasingDownPaymentDt: number;
  leasingResidualValueDt: number;
  leasingResidualValueRate: number;
}

/**
 * ESCO JOYA solution
 */
export interface EscoSolution extends FinancingSolution {
  type: FinancingSolutionType.ESCO;
  escoTargetIrrMonthly: number;
  escoTargetIrrAnnual: number;
  escoOpexIncluded: boolean;
  isViable?: boolean;
  viabilityError?: string;
}

/**
 * Calculated comparison result (before saving to database)
 */
export interface CalculatedComparisonResult {
  input: ProjectInput;
  projectCalculation: ProjectCalculation;
  cash: CashSolution;
  credit: CreditSolution;
  leasing: LeasingSolution;
  esco: EscoSolution;
}

/**
 * Complete comparison result (after saving to database)
 */
export interface ComparisonResult extends CalculatedComparisonResult {
  id: string;
}

/**
 * Comparison result creation data (without id)
 */
export interface CreateComparisonResult {
  input: ProjectInput;
  projectCalculation: ProjectCalculation;
  cash: CashSolution;
  credit: CreditSolution;
  leasing: LeasingSolution;
  esco: EscoSolution;
}

/**
 * Solution advantages/disadvantages for decision-makers
 */
export interface SolutionAdvantages {
  type: FinancingSolutionType;
  advantages: string[];
  disadvantages: string[];
  dafReading: string;
}

