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
  latitude: number;
  longitude: number;
  buildingType: BuildingTypes;
  climateZone: ClimateZones;

  measuredConsumption: number; 
  referenceMonth: number; 

  baseConsumption: number;
  monthlyConsumptions: MonthlyConsumptionData[];
  annualConsumption: number;

  annualProductible: number; 

  installedPower: number; 
  annualProducible: number; 
  expectedProduction: number; 
  systemSize_kWp: number; 
  energyCoverageRate: number; 

  monthlyPVProductions: MonthlyPVProductionData[];

  installationCost: number; 
  annualOpex: number;
  annualSavings: number; 
  totalSavings25Years: number;
  coverage: number; 
  simplePaybackYears: number;
  discountedPaybackYears: number;
  roi25Years: number;
  npv: number; 
  irr: number; 

  monthlyEconomics: MonthlyEconomicData[];
  annualEconomics: AnnualEconomicData[];

  paybackYears: number; 
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IAuditSolaireSimulation, 'createdAt' | 'updatedAt'>;

export type ICreateAuditSolaireSimulation = CreateBusinessObject<IAuditSolaireSimulation, ReadOnlyProperties>;
export type IUpdateAuditSolaireSimulation = UpdateBusinessObject<IAuditSolaireSimulation, ReadOnlyProperties>;   