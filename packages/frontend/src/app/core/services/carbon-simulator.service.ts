import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Payload for carbon footprint summary (mirrors backend CarbonFootprintSummaryInput)
 */
export interface CarbonFootprintSummaryPayload {
  electricity: {
    monthlyAmountDt: number;
    referenceMonth: number;
    buildingType: string;
    climateZone: 'Nord' | 'Centre' | 'Sud';
    tariffType: 'BT' | 'MT_UNIFORME' | 'MT_HORAIRE';
  };
  thermal: {
    hasHeatUsages: boolean;
    annualElectricityKwh: number;
    buildingType: string;
    selectedHeatUsages: string[];
    selectedHeatEnergies: string[];
  };
  cold: {
    hasCold: boolean;
    surfaceM2: number;
    buildingType: string;
    intensityLevel: string;
    equipmentAge: string;
    maintenanceStatus: string;
  };
  vehicles: {
    hasVehicles: boolean;
    numberOfVehicles: number;
    kmPerVehiclePerYear: number;
    usageType: string;
    fuelType: string;
  };
  scope3: {
    travel: {
      planeFrequency?: string | null;
      trainFrequency?: string | null;
    };
    itEquipment: {
      laptopCount: number;
      desktopCount: number;
      screenCount: number;
      proPhoneCount: number;
    };
  };
}

/**
 * Result of carbon footprint summary (mirrors backend CarbonFootprintSummaryResult)
 */
export interface CarbonFootprintSummaryResult {
  co2Scope1Kg: number;
  co2Scope1Tonnes: number;
  co2Scope2Kg: number;
  co2Scope2Tonnes: number;
  co2Scope3Kg: number;
  co2Scope3Tonnes: number;
  co2TotalKg: number;
  co2TotalTonnes: number;
}

@Injectable({ providedIn: 'root' })
export class CarbonSimulatorService {
  private api = inject(ApiService);

  calculateSummary(payload: CarbonFootprintSummaryPayload): Observable<CarbonFootprintSummaryResult> {
    return this.api.post<CarbonFootprintSummaryResult>('/carbon-simulator/summary', payload);
  }
}
