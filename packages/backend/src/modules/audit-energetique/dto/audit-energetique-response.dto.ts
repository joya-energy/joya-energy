/**
 * Response DTOs for Audit Énergétique API
 * 
 * @description
 * Structured JSON responses for energy audit simulations
 * Separates data into logical sections for better client consumption
 */

import { type IAuditEnergetiqueSimulation } from '@shared/interfaces/audit-energetique.interface';
import { ClassificationGrade, EnergyUnit, EmissionUnit } from '@shared/enums/classification.enum';

/**
 * Contact & Building Information
 */
export interface ContactInfo {
  fullName: string;
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
    unit: EnergyUnit.KWH_PER_YEAR;
  };
  monthly: {
    value: number;
    unit: EnergyUnit.KWH_PER_MONTH;
  };
  perSquareMeter: {
    value: number;
    unit: EnergyUnit.KWH_PER_M2_YEAR;
  };
}

export interface CO2Emissions {
  annual: {
    kilograms: number;
    tons: number;
    unit: EmissionUnit.KG_CO2_PER_YEAR | EmissionUnit.TONS_CO2_PER_YEAR;
  };
  perSquareMeter: {
    value: number;
    unit: EmissionUnit.KG_CO2_PER_M2_YEAR;
  };
}

export interface EnergyCost {
  annual: {
    value: number;
    unit: EnergyUnit.TND_PER_YEAR;
  };
  monthly: {
    value: number;
    unit: EnergyUnit.TND_PER_MONTH;
  };
}

export interface EnergyClassification {
  becth: number;
  class: ClassificationGrade;
  description: string;
  isApplicable: boolean;
  note?: string;
}

export interface CarbonClassification {
  class: ClassificationGrade;
  intensity: number;
  unit: EmissionUnit.KG_CO2_PER_M2_YEAR;
  totalElecKg: number;
  totalGasKg: number;
  totalKg: number;
  description: string;
  isApplicable: boolean;
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
      carbonClassification?: CarbonClassification;
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
        fullName: simulation.fullName,
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
            unit: EnergyUnit.KWH_PER_YEAR
          },
          monthly: {
            value: simulation.monthlyConsumption,
            unit: EnergyUnit.KWH_PER_MONTH
          },
          perSquareMeter: {
            value: Number(energyConsumptionPerM2.toFixed(2)),
            unit: EnergyUnit.KWH_PER_M2_YEAR
          }
        },
        
        co2Emissions: {
          annual: {
            kilograms: simulation.co2EmissionsKg,
            tons: simulation.co2EmissionsTons,
            unit: EmissionUnit.KG_CO2_PER_YEAR
          },
          perSquareMeter: {
            value: Number(co2PerM2.toFixed(2)),
            unit: EmissionUnit.KG_CO2_PER_M2_YEAR
          }
        },
        
        energyCost: {
          annual: {
            value: simulation.energyCostPerYear,
            unit: EnergyUnit.TND_PER_YEAR
          },
          monthly: {
            value: Number((simulation.energyCostPerYear / 12).toFixed(2)),
            unit: EnergyUnit.TND_PER_MONTH
          }
        }
      }
    },
    metadata: {
      version: '1.1.0',
      calculationDate: new Date().toISOString()
    }
  };

  // Add energy classification if computed
  if (simulation.energyClass && simulation.becth != null) {
    response.data.results.energyClassification = {
      becth: simulation.becth,
      class: simulation.energyClass as ClassificationGrade,
      description: simulation.energyClassDescription ?? '',
      isApplicable: true
    };
  } else {
    response.data.results.energyClassification = {
      becth: Number(energyConsumptionPerM2.toFixed(2)),
      class: ClassificationGrade.NOT_APPLICABLE,
      description: 'Classement énergétique non disponible pour ce type de bâtiment',
      isApplicable: false
    };
  }

  // Add carbon classification if computed
  if (simulation.carbonClass && simulation.carbonIntensity != null) {
    response.data.results.carbonClassification = {
      class: simulation.carbonClass as ClassificationGrade,
      intensity: Number(simulation.carbonIntensity.toFixed(2)),
      unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
      totalElecKg: Number((simulation.co2EmissionsElecKg ?? simulation.co2EmissionsKg).toFixed(2)),
      totalGasKg: Number((simulation.co2EmissionsGasKg ?? 0).toFixed(2)),
      totalKg: Number(simulation.co2EmissionsKg.toFixed(2)),
      description: simulation.carbonClassDescription ?? '',
      isApplicable: true
    };
  } else {
    response.data.results.carbonClassification = {
      class: ClassificationGrade.NOT_APPLICABLE,
      intensity: Number(co2PerM2.toFixed(2)),
      unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
      totalElecKg: Number((simulation.co2EmissionsElecKg ?? simulation.co2EmissionsKg).toFixed(2)),
      totalGasKg: Number((simulation.co2EmissionsGasKg ?? 0).toFixed(2)),
      totalKg: Number(simulation.co2EmissionsKg.toFixed(2)),
      description: 'Classement carbone non disponible',
      isApplicable: false
    };
  }

  return response;
}

