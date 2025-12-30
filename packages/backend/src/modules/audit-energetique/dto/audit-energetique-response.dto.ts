/**
 * Response DTOs for Audit Énergétique API
 *
 * Structured JSON responses for energy audit simulations
 */

import { type IAuditEnergetiqueSimulation } from '@shared/interfaces/audit-energetique.interface';
import {
  ClassificationGrade,
  EnergyUnit,
  EmissionUnit
} from '@shared/enums/classification.enum';

/* ============================================================
 * BASIC INFORMATION DTOs
 * ============================================================ */

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

/* ============================================================
 * ENERGY RESULTS DTOs
 * ============================================================ */

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
  totalAnnualEnergy: number;
  siteIntensity: number;
  referenceIntensity: number;
  joyaIndex: number;
  becth: number;
  class: ClassificationGrade;
  description: string;
  isApplicable: boolean;
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

/* ============================================================
 * 🔥 END-USE BREAKDOWN DTOs (IMPORTANT)
 * ============================================================ */

export interface EnergyEndUseItemDto {
  consumptionKwh: number;
  costTnd: number;
  sharePercent: number;
}

export interface EnergyEndUseBreakdownDto {
  totalConsumptionKwh: number;
  totalCostTnd: number;
  breakdown: {
    cooling: EnergyEndUseItemDto;
    heating: EnergyEndUseItemDto;
    lighting: EnergyEndUseItemDto;
    equipment: EnergyEndUseItemDto;
    dhw: EnergyEndUseItemDto;
  };
}

/* ============================================================
 * MAIN RESPONSE DTO
 * ============================================================ */

export interface AuditEnergetiqueResponseDto {
  success: boolean;
  data: {
    simulationId: string;
    createdAt: string;

    contact: ContactInfo;
    building: BuildingCharacteristics;
    envelope: BuildingEnvelope;
    systems: EnergySystems;
    billing: BillingInfo;
    existingMeasures: string[];

    results: {
      energyConsumption: EnergyConsumption;
      co2Emissions: CO2Emissions;
      energyCost: EnergyCost;

      energyEndUseBreakdown?: EnergyEndUseBreakdownDto;

      energyClassification?: EnergyClassification;
      carbonClassification?: CarbonClassification;
    };
  };
  metadata: {
    version: string;
    calculationDate: string;
  };
}

/* ============================================================
 * ENTITY → DTO MAPPER
 * ============================================================ */

export function toAuditEnergetiqueResponseDto(
  simulation: IAuditEnergetiqueSimulation
): AuditEnergetiqueResponseDto {
  const energyConsumptionPerM2 =
    simulation.annualConsumption / simulation.surfaceArea;

  const co2PerM2 =
    simulation.co2EmissionsKg / simulation.surfaceArea;

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

  /* -------- END-USE BREAKDOWN -------- */
  if (simulation.energyEndUseBreakdown) {
    response.data.results.energyEndUseBreakdown =
      simulation.energyEndUseBreakdown as EnergyEndUseBreakdownDto;
  }

  /* -------- ENERGY CLASSIFICATION -------- */
  if (simulation.energyClass && simulation.totalAnnualEnergy != null) {
    response.data.results.energyClassification = {
      totalAnnualEnergy: simulation.totalAnnualEnergy,
      siteIntensity: simulation.siteIntensity ?? energyConsumptionPerM2,
      referenceIntensity: simulation.referenceIntensity ?? 0,
      joyaIndex: simulation.joyaIndex ?? 0,
      becth: simulation.becth ?? energyConsumptionPerM2,
      class: simulation.energyClass as ClassificationGrade,
      description: simulation.energyClassDescription ?? '',
      isApplicable: true
    };
  } else {
    response.data.results.energyClassification = {
      totalAnnualEnergy: simulation.annualConsumption,
      siteIntensity: energyConsumptionPerM2,
      referenceIntensity: 0,
      joyaIndex: 0,
      becth: energyConsumptionPerM2,
      class: ClassificationGrade.NOT_APPLICABLE,
      description: 'Classement énergétique non applicable',
      isApplicable: false
    };
  }

  /* -------- CARBON CLASSIFICATION -------- */
  if (simulation.carbonClass && simulation.carbonIntensity != null) {
    response.data.results.carbonClassification = {
      class: simulation.carbonClass as ClassificationGrade,
      intensity: Number(simulation.carbonIntensity.toFixed(2)),
      unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
      totalElecKg: simulation.co2EmissionsElecKg ?? simulation.co2EmissionsKg,
      totalGasKg: simulation.co2EmissionsGasKg ?? 0,
      totalKg: simulation.co2EmissionsKg,
      description: simulation.carbonClassDescription ?? '',
      isApplicable: true
    };
  } else {
    response.data.results.carbonClassification = {
      class: ClassificationGrade.NOT_APPLICABLE,
      intensity: Number(co2PerM2.toFixed(2)),
      unit: EmissionUnit.KG_CO2_PER_M2_YEAR,
      totalElecKg: simulation.co2EmissionsElecKg ?? simulation.co2EmissionsKg,
      totalGasKg: simulation.co2EmissionsGasKg ?? 0,
      totalKg: simulation.co2EmissionsKg,
      description: 'Classement carbone non applicable',
      isApplicable: false
    };
  }

  return response;
}
