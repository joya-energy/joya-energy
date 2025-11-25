/**
 * Response DTOs for Audit Énergétique API
 * 
 * @description
 * Structured JSON responses for energy audit simulations
 * Separates data into logical sections for better client consumption
 */

import { type IAuditEnergetiqueSimulation } from '@shared/interfaces/audit-energetique.interface';

/**
 * Contact & Building Information
 */
export interface ContactInfo {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  governorate: string;
}

export interface BuildingCharacteristics {
  type: string;
  surfaceArea: number;
  floors: number;
  activityType: string;
  openingHoursPerDay: number;
  openingDaysPerWeek: number;
}

export interface BuildingEnvelope {
  insulation: string;
  glazingType: string;
  ventilation: string;
  climateZone: string;
}

export interface EnergySystems {
  heating: string;
  cooling: string;
  conditionedCoverage: string;
  domesticHotWater: string;
  equipmentCategories: string[];
  lightingType: string;
}

export interface BillingInfo {
  tariffType: string;
  contractedPower?: number;
  monthlyBillAmount: number;
  hasRecentBill: boolean;
  recentBillConsumption?: number;
  billAttachmentUrl?: string;
}

/**
 * Energy Calculation Results
 */
export interface EnergyConsumption {
  annual: {
    value: number;
    unit: 'kWh/an';
  };
  monthly: {
    value: number;
    unit: 'kWh/mois';
  };
  perSquareMeter: {
    value: number;
    unit: 'kWh/m².an';
  };
}

export interface CO2Emissions {
  annual: {
    kilograms: number;
    tons: number;
    unit: 'kg CO₂/an' | 't CO₂/an';
  };
  perSquareMeter: {
    value: number;
    unit: 'kg CO₂/m².an';
  };
}

export interface EnergyCost {
  annual: {
    value: number;
    unit: 'TND/an';
  };
  monthly: {
    value: number;
    unit: 'TND/mois';
  };
}

export interface EnergyClassification {
  becth: number;
  class: string;
  description: string;
  isApplicable: boolean;
  note?: string;
}

/**
 * Main Response DTO
 */
export interface AuditEnergetiqueResponseDto {
  success: boolean;
  data: {
    simulationId: string;
    createdAt: string;
    
    // Section 1: Informations
    contact: ContactInfo;
    building: BuildingCharacteristics;
    envelope: BuildingEnvelope;
    systems: EnergySystems;
    billing: BillingInfo;
    existingMeasures: string[];
    
    // Section 2: Résultats énergétiques
    results: {
      energyConsumption: EnergyConsumption;
      co2Emissions: CO2Emissions;
      energyCost: EnergyCost;
      energyClassification?: EnergyClassification;
    };
  };
  metadata: {
    version: string;
    calculationDate: string;
  };
}

/**
 * Transforms database entity to structured response DTO
 */
export function toAuditEnergetiqueResponseDto(
  simulation: IAuditEnergetiqueSimulation
): AuditEnergetiqueResponseDto {
  const energyConsumptionPerM2 = simulation.annualConsumption / simulation.surfaceArea;
  const co2PerM2 = simulation.co2EmissionsKg / simulation.surfaceArea;

  const response: AuditEnergetiqueResponseDto = {
    success: true,
    data: {
      simulationId: simulation.id,
      createdAt: simulation.createdAt.toISOString(),
      
      contact: {
        firstName: simulation.firstName,
        lastName: simulation.lastName,
        companyName: simulation.companyName,
        email: simulation.email,
        phoneNumber: simulation.phoneNumber,
        address: simulation.address,
        governorate: simulation.governorate
      },
      
      building: {
        type: simulation.buildingType,
        surfaceArea: simulation.surfaceArea,
        floors: simulation.floors,
        activityType: simulation.activityType,
        openingHoursPerDay: simulation.openingHoursPerDay,
        openingDaysPerWeek: simulation.openingDaysPerWeek
      },
      
      envelope: {
        insulation: simulation.insulation,
        glazingType: simulation.glazingType,
        ventilation: simulation.ventilation,
        climateZone: simulation.climateZone
      },
      
      systems: {
        heating: simulation.heatingSystem,
        cooling: simulation.coolingSystem,
        conditionedCoverage: simulation.conditionedCoverage,
        domesticHotWater: simulation.domesticHotWater,
        equipmentCategories: simulation.equipmentCategories,
        lightingType: simulation.lightingType
      },
      
      billing: {
        tariffType: simulation.tariffType,
        contractedPower: simulation.contractedPower,
        monthlyBillAmount: simulation.monthlyBillAmount,
        hasRecentBill: simulation.hasRecentBill,
        recentBillConsumption: simulation.recentBillConsumption,
        billAttachmentUrl: simulation.billAttachmentUrl
      },
      
      existingMeasures: simulation.existingMeasures,
      
      results: {
        energyConsumption: {
          annual: {
            value: simulation.annualConsumption,
            unit: 'kWh/an'
          },
          monthly: {
            value: simulation.monthlyConsumption,
            unit: 'kWh/mois'
          },
          perSquareMeter: {
            value: Number(energyConsumptionPerM2.toFixed(2)),
            unit: 'kWh/m².an'
          }
        },
        
        co2Emissions: {
          annual: {
            kilograms: simulation.co2EmissionsKg,
            tons: simulation.co2EmissionsTons,
            unit: 'kg CO₂/an'
          },
          perSquareMeter: {
            value: Number(co2PerM2.toFixed(2)),
            unit: 'kg CO₂/m².an'
          }
        },
        
        energyCost: {
          annual: {
            value: simulation.energyCostPerYear,
            unit: 'TND/an'
          },
          monthly: {
            value: Number((simulation.energyCostPerYear / 12).toFixed(2)),
            unit: 'TND/mois'
          }
        }
      }
    },
    metadata: {
      version: '1.1.0',
      calculationDate: new Date().toISOString()
    }
  };

  // Add energy classification if applicable
  if (simulation.energyClass && simulation.becth != null) {
    response.data.results.energyClassification = {
      becth: simulation.becth,
      class: simulation.energyClass,
      description: simulation.energyClassDescription ?? '',
      isApplicable: true
    };
  } else {
    response.data.results.energyClassification = {
      becth: 0,
      class: 'N/A',
      description: 'Classement énergétique non applicable à ce type de bâtiment',
      isApplicable: false,
      note: 'Le classement BECTh est réservé aux bâtiments de type Bureau / Administration / Banque'
    };
  }

  return response;
}

