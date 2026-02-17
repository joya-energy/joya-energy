import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AuditEnergetiqueRequest {
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  governorate: string;
  buildingType: string;
  surfaceArea: number;
  floors: number;
  activityType: string;
  openingDaysPerWeek: number;
  openingHoursPerDay: number;
  insulation: string;
  glazingType: string;
  ventilation: string;
  climateZone: string;
  heatingSystem: string;
  coolingSystem: string;
  conditionedCoverage: string;
  domesticHotWater: string;
  equipmentCategories?: string[];
  tariffType: string;
  contractedPower?: number;
  monthlyBillAmount: number;
  hasRecentBill: boolean;
  recentBillConsumption?: number;
  billAttachmentUrl?: string;
  existingMeasures?: string[];
  lightingType: string;
}

export interface EnergyResultValue {
  value: number;
  unit: string;
}

export interface CO2ResultValue {
  kilograms: number;
  tons: number;
  unit: string;
}

export interface EnergyConsumptionResult {
  annual: EnergyResultValue;
  monthly: EnergyResultValue;
  perSquareMeter: EnergyResultValue;
}

export interface CO2EmissionsResult {
  annual: CO2ResultValue;
  perSquareMeter: EnergyResultValue;
}

export interface EnergyCostResult {
  annual: EnergyResultValue;
  monthly: EnergyResultValue;
}

export interface EnergyClassificationResult {
  becth: number;
  class: string;
  description: string;
  isApplicable: boolean;
}

export interface CarbonClassificationResult {
  class: string;
  intensity: number;
  unit: string;
  totalElecKg: number;
  totalGasKg: number;
  totalKg: number;
  description: string;
  isApplicable: boolean;
}

export interface SimulationResults {
  energyConsumption: EnergyConsumptionResult;
  co2Emissions: CO2EmissionsResult;
  energyCost: EnergyCostResult;
  energyClassification?: EnergyClassificationResult;
  carbonClassification?: CarbonClassificationResult;
}

export interface AuditEnergetiqueResponse {
  success: boolean;
  data: {
    simulationId: string;
    createdAt: string;
    results: SimulationResults;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuditEnergetiqueService {
  private api = inject(ApiService);

  createSimulation(payload: AuditEnergetiqueRequest): Observable<AuditEnergetiqueResponse> {
    return this.api.post<AuditEnergetiqueResponse>('/audit-energetique-simulations', payload);
  }

  generateAndSendPDF(simulationId: string): Observable<{ message: string; email: string; simulationId: string }> {
    return this.api.post<{ message: string; email: string; simulationId: string }>(
      '/audit-energetique-simulations/send-pdf',
      { simulationId }
    );
  }
}
