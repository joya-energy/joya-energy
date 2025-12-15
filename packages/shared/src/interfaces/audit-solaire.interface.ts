import { BusinessObject, CreateBusinessObject, UpdateBusinessObject } from './buisness.interface';

export interface  IAuditSolaireSimulation extends BusinessObject {
  latitude: number;
  longitude: number;
  surfaceArea: number;
  annualConsumption: number;
  annualIrradiation: number;
  expectedProduction: number;
  systemSize_kWp: number;
  installationCost: number;
  annualSavings: number;
  coverage: number;
  paybackYears: number;
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IAuditSolaireSimulation, 'createdAt' | 'updatedAt'>;

export type ICreateAuditSolaireSimulation = CreateBusinessObject<IAuditSolaireSimulation, ReadOnlyProperties>;
export type IUpdateAuditSolaireSimulation = UpdateBusinessObject<IAuditSolaireSimulation, ReadOnlyProperties>;   