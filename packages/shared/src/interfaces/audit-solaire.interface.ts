import { BusinessObject, CreateBusinessObject, UpdateBusinessObject } from './buisness.interface';
import { BuildingTypes, ClimateZones } from '../enums/audit-general.enum';

export interface MonthlyConsumptionData {
  month: number;
  rawConsumption: number;
  estimatedConsumption: number;
  climaticCoefficient: number;
  buildingCoefficient: number;
  effectiveCoefficient: number;
}

export interface MonthlyPVProductionData {
  month: number;
  rawConsumption: number;
  pvProduction: number;
  netConsumption: number;
  credit: number;
}

export interface MonthlyEconomicData {
  month: number;
  rawConsumption: number;
  billedConsumption: number; // C_fact(m) 
  appliedTariffRate: number; 
  billWithoutPV: number;
  billWithPV: number;
  monthlySavings: number;
}

export interface AnnualEconomicData {
  year: number;
  annualRawConsumption: number; 
  annualBilledConsumption: number; 
  annualBillWithoutPV: number;
  annualBillWithPV: number;
  annualSavings: number;
  averageAvoidedTariff: number; 
  capex: number;
  opex: number;
  netGain: number; 
  cumulativeCashFlow: number;
  cumulativeCashFlowDiscounted: number;
  cumulativeNetGain: number; 
  cumulativeNetGainDiscounted: number; 
}

export interface  IAuditSolaireSimulation extends BusinessObject {
  // Location & Site
  address?: string;
  fullName: string;
  companyName?: string;
  email: string;
  phoneNumber?: string;
  latitude: number;
  longitude: number;
  buildingType: BuildingTypes;
  climateZone: ClimateZones;

  measuredAmount: number; // Monthly bill amount in TND
  referenceMonth: number;

  baseConsumption: number; // Calculated from amount in kWh
  monthlyConsumptions: MonthlyConsumptionData[];
  annualConsumption: number;

  annualProductible: number; 

  installedPower: number; 
  annualProducible: number; 
  expectedProduction: number; 
  systemSize_kWp: number; // in kWc (kilowatt-crête) 
  energyCoverageRate: number; 

  monthlyPVProductions: MonthlyPVProductionData[];

  installationCost: number; // CAPEX in DT
  annualOpex: number;
  annualSavings: number; 
  totalSavings25Years: number;
  coverage: number; 
  simplePaybackYears?: number; // Payback simple in months
  discountedPaybackYears?: number; // Payback actualisé in months
  roi25Years?: number; // ROI as a ratio (multiply by 100 for percentage)
  npv?: number; // VAN in DT
  irr: number; // Internal Rate of Return (TRI)

  // Environmental Impact
  annualCo2Avoided: number; // Annual CO2 emissions avoided (kg)
  totalCo2Avoided25Years: number; // Total CO2 avoided over 25 years (kg)

  // First year annual economic summary
  annualBillWithoutPV: number;
  annualBillWithPV: number;
  averageAnnualSavings: number;

  monthlyEconomics: MonthlyEconomicData[];
  annualEconomics: AnnualEconomicData[];

  paybackMonths: number; // Payback period in months
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IAuditSolaireSimulation, 'createdAt' | 'updatedAt'>;

export type ICreateAuditSolaireSimulation = CreateBusinessObject<IAuditSolaireSimulation, ReadOnlyProperties>;
export type IUpdateAuditSolaireSimulation = UpdateBusinessObject<IAuditSolaireSimulation, ReadOnlyProperties>;   