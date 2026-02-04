import { BusinessObject, CreateBusinessObject } from './buisness.interface';

/**
 * Input utilisateur - ce que le client saisit
 */
export interface IFinancialComparisonInput {
  location: string;
  installationSizeKwp?: number;
  investmentAmountDt?: number;
}

/**
 * Paramètres projet (config JOYA)
 */
export interface IProjectParameters {
  costPerKwpDt: number;
  yieldKwhPerKwpYear: number;
  electricityPriceDtPerKwh: number;
  opexRateAnnual: number;
}

/**
 * Paramètres crédit bancaire
 */
export interface ICreditParameters {
  creditAnnualRate: number;
  selfFinancingRate: number;
}

/**
 * Paramètres leasing
 */
export interface ILeasingParameters {
  leasingAnnualRate: number;
  leasingResidualValueRate: number;
  leasingOpexMultiplier: number;
  selfFinancingRate: number;
}

/**
 * Paramètres ESCO JOYA
 */
export interface IEscoParameters {
  escoTargetIrrAnnual: number;
  escoOpexIncluded: boolean;
}

/**
 * Calculs projet - socle commun
 */
export interface IProjectCalculations {
  sizeKwp: number;
  capexDt: number;
  annualProductionKwh: number;
  annualGrossSavingsDt: number;
  monthlyGrossSavingsDt: number;
  annualOpexDt: number;
  monthlyOpexDt: number;
}

/**
 * Autofinancement
 */
export interface ISelfFinancing {
  selfFinancingDt: number;
  financedPrincipalDt: number;
}

/**
 * Solution de financement générique
 */
export interface IFinancingSolution {
  type: 'cash' | 'credit' | 'leasing' | 'esco';
  initialInvestment: number;
  monthlyPayment: number;
  monthlyOpex: number;
  totalMonthlyCost: number;
  monthlyCashflow: number;
  durationMonths: number;
  durationYears: number;
}

/**
 * Solution comptant
 */
export interface ICashSolution extends IFinancingSolution {
  type: 'cash';
}

/**
 * Solution crédit bancaire
 */
export interface ICreditSolution extends IFinancingSolution {
  type: 'credit';
  creditMonthlyRate: number;
  creditAnnualRate: number;
  selfFinancingDt: number;
  financedPrincipalDt: number;
}

/**
 * Solution leasing
 */
export interface ILeasingSolution extends IFinancingSolution {
  type: 'leasing';
  leasingMonthlyRate: number;
  leasingAnnualRate: number;
  leasingDownPaymentDt: number;
  leasingResidualValueDt: number;
  leasingResidualValueRate: number;
}

/**
 * Solution ESCO JOYA
 */
export interface IEscoSolution extends IFinancingSolution {
  type: 'esco';
  escoTargetIrrMonthly: number;
  escoTargetIrrAnnual: number;
  escoOpexIncluded: boolean;
}

/**
 * Résultat complet de la comparaison
 */
export interface IFinancialComparison extends BusinessObject {
  input: IFinancialComparisonInput;
  projectCalculations: IProjectCalculations;
  cash: ICashSolution;
  credit: ICreditSolution;
  leasing: ILeasingSolution;
  esco: IEscoSolution;
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IFinancialComparison, 'createdAt' | 'updatedAt' | 'cash' | 'credit' | 'leasing' | 'esco' | 'projectCalculations'>;

export type ICreateFinancialComparison = CreateBusinessObject<IFinancialComparison, ReadOnlyProperties>;

