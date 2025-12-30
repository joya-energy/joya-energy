import CommonService from '@backend/modules/common/common.service';
import {
  type IAuditEnergetiqueSimulation,
  type ICreateAuditEnergetiqueSimulation,
  type IUpdateAuditEnergetiqueSimulation
} from '@shared/interfaces/audit-energetique.interface';
import { AuditEnergetiqueSimulationRepository } from './audit-energetique.repository';
import { HTTP404Error } from '@backend/errors/http.error';
import { HeatingSystemTypes } from '@shared/enums/audit-batiment.enum';
import {
  BUILDING_COEFFICIENTS,
  PROCESS_FACTORS,
  ECS_USAGE_FACTORS,
  CLIMATE_FACTORS,
  COOLING_COVERAGE_FACTORS,
  EMISSION_FACTORS
} from './config';

import {
  computeEnvelopeFactor,
  computeCompactnessFactor,
  computeUsageFactor,
  computeHvacLoads,
  computeEquipmentLoads,
  computeDomesticHotWaterLoad,
  computeCo2Emissions,
  computeEnergyClass,
  computeEnergySplit,
  computeProgressiveTariff
} from './helpers';

import { Logger } from '@backend/middlewares';

export type AuditEnergetiqueCreateInput = Omit<
  ICreateAuditEnergetiqueSimulation,
  | 'annualConsumption'
  | 'monthlyConsumption'
  | 'energyCostPerYear'
  | 'co2EmissionsKg'
  | 'co2EmissionsTons'
  | 'energyClass'
  | 'energyClassDescription'
  | 'becth'
>;

const HEATING_SYSTEM_EFFICIENCIES: Record<HeatingSystemTypes, number> = {
  [HeatingSystemTypes.NONE]: 1,
  [HeatingSystemTypes.ELECTRIC_INDIVIDUAL]: 1,
  [HeatingSystemTypes.ELECTRIC_HEATING]: 0.92,
  [HeatingSystemTypes.REVERSIBLE_AC]: 1,
  [HeatingSystemTypes.GAS_BOILER]: 0.7,
  [HeatingSystemTypes.OTHER]: 0.8
};

export class AuditSimulationService extends CommonService<
  IAuditEnergetiqueSimulation,
  ICreateAuditEnergetiqueSimulation,
  IUpdateAuditEnergetiqueSimulation
> {
  constructor() {
    super(new AuditEnergetiqueSimulationRepository());
  }

  public async createSimulation(
    payload: AuditEnergetiqueCreateInput
  ): Promise<IAuditEnergetiqueSimulation> {

    /* -----------------------------------------
     * BUILDING & USAGE FACTORS
     * ----------------------------------------- */

    const envelopeFactor = computeEnvelopeFactor(
      payload.insulation,
      payload.glazingType,
      payload.ventilation
    );

    const compactnessFactor = computeCompactnessFactor(payload.floors);
    const usageFactor = computeUsageFactor(
      payload.openingHoursPerDay,
      payload.openingDaysPerWeek
    );

    const processFactor = PROCESS_FACTORS[payload.buildingType] ?? 1;
    const climate = CLIMATE_FACTORS[payload.climateZone];
    const coeffs = BUILDING_COEFFICIENTS[payload.buildingType];

    /* -----------------------------------------
     * LOADS (kWh/m²)
     * ----------------------------------------- */

    const lightingLoad = coeffs.light * usageFactor;
    const itLoad = coeffs.it * usageFactor * processFactor;
    const baseLoad = coeffs.base;

    const equipmentLoad = computeEquipmentLoads({
      buildingType: payload.buildingType,
      categories: payload.equipmentCategories ?? [],
      usageFactor,
      processFactor,
      surface: payload.surfaceArea
    });

    const hvacLoads = computeHvacLoads({
      hvacBase: coeffs.hvac * envelopeFactor * compactnessFactor,
      climate,
      usageFactor,
      heatingSystem: payload.heatingSystem,
      coolingSystem: payload.coolingSystem,
      conditionedCoverage: payload.conditionedCoverage,
      heatingK: Number(process.env.ENERGY_AUDIT_K_CH),
      coolingK: Number(process.env.ENERGY_AUDIT_K_FR)
    });

    const ecsLoad = computeDomesticHotWaterLoad({
      ecsType: payload.domesticHotWater,
      ecsUsageFactor: ECS_USAGE_FACTORS[payload.buildingType] ?? 1,
      reference: coeffs.ecs,
      gasEfficiency: Number(process.env.ENERGY_AUDIT_ECS_GAS_EFF),
      electricEfficiency: Number(process.env.ENERGY_AUDIT_ECS_ELEC_EFF)
    });

    /* -----------------------------------------
     * ANNUAL CONSUMPTION
     * ----------------------------------------- */

    const annualConsumption =
      (
        lightingLoad +
        itLoad +
        baseLoad +
        equipmentLoad.perSquare +
        hvacLoads.perSquare +
        ecsLoad.perSquare
      ) * payload.surfaceArea;

    const monthlyConsumption = annualConsumption / 12;

    /* -----------------------------------------
     * ENERGY SPLIT & EMISSIONS
     * ----------------------------------------- */

    const annualHeatingKwh = hvacLoads.heatingLoad * payload.surfaceArea;
    const annualEcsKwh =
      ecsLoad.perSquare * payload.surfaceArea + (ecsLoad.absoluteKwh ?? 0);

    const energySplit = computeEnergySplit({
      totalConsumption: annualConsumption,
      heatingSystem: payload.heatingSystem,
      ecsType: payload.domesticHotWater,
      heatingLoadKwh: annualHeatingKwh,
      ecsLoadKwh: annualEcsKwh
    });

    const coverageFactor =
      COOLING_COVERAGE_FACTORS[payload.conditionedCoverage] ?? 1;

    const conditionedSurface = payload.surfaceArea * coverageFactor;

    const emissions = computeCo2Emissions({
      electricityConsumption: energySplit.electricityConsumption,
      gasConsumption: energySplit.gasConsumption,
      buildingType: payload.buildingType,
      conditionedSurface,
      emissionFactorElec: EMISSION_FACTORS.ELECTRICITY,
      emissionFactorGas: EMISSION_FACTORS.NATURAL_GAS
    });

    /* -----------------------------------------
     * ENERGY CLASS
     * ----------------------------------------- */

    const energyClassResult = computeEnergyClass({
      buildingType: payload.buildingType,
      electricityConsumption: annualConsumption,
      gasConsumption: energySplit.gasConsumption,
      conditionedSurface,
      gasEfficiency:
        HEATING_SYSTEM_EFFICIENCIES[payload.heatingSystem] ?? 0.9
    });

    /* -----------------------------------------
     * COST
     * ----------------------------------------- */

    const tariff = computeProgressiveTariff({ monthlyConsumption });
    const avgPrice = tariff.annualCost / annualConsumption;

    /* -----------------------------------------
     * END-USE BREAKDOWN (🔥 FIX)
     * ----------------------------------------- */

    const coolingKwh =
      (hvacLoads.coolingLoad ?? 0) * payload.surfaceArea;
    const heatingKwh = annualHeatingKwh;
    const lightingKwh = lightingLoad * payload.surfaceArea;
    const ecsKwh = annualEcsKwh;
    const equipmentKwh =
      (itLoad + baseLoad + equipmentLoad.perSquare) *
        payload.surfaceArea +
      (equipmentLoad.absoluteKwh ?? 0);

    const sum =
      coolingKwh +
      heatingKwh +
      lightingKwh +
      ecsKwh +
      equipmentKwh;

    const scale = sum > 0 ? annualConsumption / sum : 1;

const percent = (cost: number) =>
  tariff.annualCost > 0
    ? Math.round((cost / tariff.annualCost) * 100)
    : 0;

const endUses = {
  breakdown: {
    cooling: {
      consumptionKwh: Number((coolingKwh * scale).toFixed(2)),
      costTnd: Number((coolingKwh * scale * avgPrice).toFixed(2)),
      sharePercent: percent(coolingKwh * scale * avgPrice),
    },
    heating: {
      consumptionKwh: Number((heatingKwh * scale).toFixed(2)),
      costTnd: Number((heatingKwh * scale * avgPrice).toFixed(2)),
      sharePercent: percent(heatingKwh * scale * avgPrice),
    },
    lighting: {
      consumptionKwh: Number((lightingKwh * scale).toFixed(2)),
      costTnd: Number((lightingKwh * scale * avgPrice).toFixed(2)),
      sharePercent: percent(lightingKwh * scale * avgPrice),
    },
    equipment: {
      consumptionKwh: Number((equipmentKwh * scale).toFixed(2)),
      costTnd: Number((equipmentKwh * scale * avgPrice).toFixed(2)),
      sharePercent: percent(equipmentKwh * scale * avgPrice),
    },
    dhw: {
      consumptionKwh: Number((ecsKwh * scale).toFixed(2)),
      costTnd: Number((ecsKwh * scale * avgPrice).toFixed(2)),
      sharePercent: percent(ecsKwh * scale * avgPrice),
    },
  },
  totalConsumptionKwh: Number(annualConsumption.toFixed(2)),
  totalCostTnd: Number(tariff.annualCost.toFixed(2)),
};

    Logger.info('Energy end-use breakdown computed');

    /* -----------------------------------------
     * SAVE
     * ----------------------------------------- */

    return await this.create({
      ...payload,
      equipmentCategories: payload.equipmentCategories ?? [],
      annualConsumption: Number(annualConsumption.toFixed(2)),
      monthlyConsumption: Number(monthlyConsumption.toFixed(2)),
      energyCostPerYear: tariff.annualCost,
      energyEndUseBreakdown: endUses,
      co2EmissionsKg: emissions.totalCo2,
      co2EmissionsTons: emissions.totalCo2Tons,
      carbonClass: emissions.carbonClass ?? undefined,
      carbonIntensity: emissions.carbonIntensity ?? undefined,
      energyClass: energyClassResult.joyaClass ?? undefined,
      energyClassDescription: energyClassResult.classDescription ?? undefined,
      totalAnnualEnergy: energyClassResult.totalAnnualEnergy,
      siteIntensity: energyClassResult.siteIntensity,
      referenceIntensity: energyClassResult.referenceIntensity ?? undefined,

    });
  }

  public async getSimulationById(id: string) {
    const simulation = await this.findById(id);
    if (!simulation) throw new HTTP404Error('Audit simulation not found');
    return simulation;
  }

  public async deleteSimulation(id: string) {
    const deleted = await this.delete(id);
    if (!deleted) throw new HTTP404Error('Audit simulation not found');
  }
}

export const auditSimulationService = new AuditSimulationService();
